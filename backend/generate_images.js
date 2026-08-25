import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

async function generateImages() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('No OpenAI API key found');
    process.exit(1);
  }

  const prompts = [
    {
      name: 'new_order.png',
      prompt: "A high-end, vibrant 3D illustration for a restaurant notification indicating a 'New Order'. The scene features a sleek, glowing modern receipt printing out of a futuristic point-of-sale terminal, surrounded by a delicious, stylized Indian yogurt drink (Lassi) in a glass and a premium food cloche lifting up slightly with warm glowing light inside. The background is a dark, sleek gradient with neon teal and orange accents, giving it a premium, industry-level app aesthetic. Highly detailed, soft lighting, UI asset style."
    },
    {
      name: 'order_cancelled.png', 
      prompt: "A high-end, vibrant 3D illustration for a restaurant notification indicating 'Order Cancelled'. The scene features a stylized, glowing red 'X' or warning symbol over a sleek, modern receipt that is slightly crumpled. Premium dark aesthetic with neon red and dark grey accents. Highly detailed, soft lighting, UI asset style."
    }
  ];

  for (const item of prompts) {
    console.log(`Generating image for ${item.name}...`);
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt: item.prompt,
          n: 1,
          size: "1024x1024"
        })
      });

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url;
        console.log(`Generated URL: ${imageUrl}`);
        // Download the image
        const imgResponse = await fetch(imageUrl);
        const buffer = await imgResponse.arrayBuffer();
        fs.writeFileSync(item.name, Buffer.from(buffer));
        console.log(`Saved ${item.name}`);
      } else {
        console.error('Failed to generate:', data);
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

generateImages();
