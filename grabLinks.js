import {getJson} from 'serpapi'
import 'dotenv/config'
import fs from 'node:fs/promises'

async function uploadImageToSerpApi(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  
  // Create multipart/form-data payload
  const formData = new FormData();
  formData.append('image', new Blob([fileBuffer]), 'image.png');
  formData.append('api_key', process.env.SERPAPI_KEY);

  const response = await fetch('https://serpapi.com/image', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload image to SerpApi');
  }

  return data.image_id; // Returns unique image ID
}

export async function runWebDetection(files) {
    const urlList = await Promise.allSettled(
        files.map(async (filePath)=>{
            const imageId = await uploadImageToSerpApi(filePath)
            const json = await getJson({
                engine: "google_lens",
                image_id: imageId,
                api_key: process.env.SERPAPI_KEY, 
            });

            return json.visual_matches || [];
        })
    )

    return urlList.flatMap(result =>{
        if (result.status === 'fulfilled') {
            return result.value.map(match => match.link).filter(Boolean)
        }
        console.error('SerpApi Error:', result.reason?.message || result.reason);
        return [];
    })


}
