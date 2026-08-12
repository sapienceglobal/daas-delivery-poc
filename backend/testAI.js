import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function test() {
  const mongoUri = process.env.MONGODB_URI.replace('/daas_poc?', '/daas_poc_lassi_lounge?');
  await mongoose.connect(mongoUri);
  const items = await mongoose.connection.db.collection('menuitems').find({ restaurantId: new mongoose.Types.ObjectId('6a606320a0c4ad20ccee7e0c') }).toArray();
  console.log('Items found in daas_poc_lassi_lounge:', items.length);

  const simplifiedMenu = items.map(i => ({
    id: i._id.toString(),
    name: i.name,
    description: i.description || '',
    tags: i.tags || []
  }));

  console.log('Sample simplified items:', simplifiedMenu.slice(0, 2));

  const prompt = `
    You are an AI semantic search engine for a restaurant menu.
    The user searched for: "kuch meetha"
    
    IMPORTANT: The user's query might be in English, Hindi, or Hinglish. 
    Translate their intent internally. For example:
    - "kuch meetha" or "mithai" means "something sweet" or "dessert".
    
    Here is the restaurant menu in JSON format:
    ${JSON.stringify(simplifiedMenu)}
    
    Return the IDs of the items that semantically match the user's query.
    Order the results by relevance. Return maximum 10 items.
    
    Output strictly in this JSON format:
    {
      "results": ["id1", "id2", "id3"]
    }
  `;

  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const resultText = aiResponse.data.choices[0].message.content;
  console.log('AI OUTPUT:', resultText);
  
  const parsed = JSON.parse(resultText);
  const matchedItems = parsed.results
        .map(id => items.find(i => i._id.toString() === id))
        .filter(i => i != null);
        
  console.log('Matched items count:', matchedItems.length);
  process.exit(0);
}
test();
