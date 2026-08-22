import axios from 'axios';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import Restaurant from '../models/Restaurant.js';

export const predictSales = asyncHandler(async (req, response) => {
  const { restaurantId } = req.body;
  
  // 1. Gather historical data for context (e.g. last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const orders = await Order.find({
    restaurantId,
    createdAt: { $gte: thirtyDaysAgo },
    status: { $in: ['delivered', 'picked_up'] }
  });

  // group by day for OpenAI
  const dailyData = {};
  orders.forEach(o => {
    const d = o.createdAt.toISOString().split('T')[0];
    if (!dailyData[d]) dailyData[d] = { orders: 0, revenue: 0 };
    dailyData[d].orders += 1;
    dailyData[d].revenue += o.total || 0;
  });

  const prompt = `
    You are an expert restaurant data analyst. 
    Here is the daily sales data for the last 30 days:
    ${JSON.stringify(dailyData)}
    
    Based on this data, predict the sales revenue and order volume for the next 7 days.
    Also provide a brief 2-sentence actionable insight.
    
    Output strictly in this JSON format:
    {
      "predictions": [
        { "day": 1, "predictedRevenue": 0, "predictedOrders": 0 },
        ... up to day 7
      ],
      "insight": "Your actionable insight here."
    }
  `;

  if (!process.env.OPENAI_API_KEY) {
    throw new AppError('OpenAI API Key is missing on the server', 500);
  }

  try {
    const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const output = JSON.parse(aiRes.data.choices[0].message.content);
    res.success(response, { data: output });
  } catch (error) {
    throw new AppError(error.response?.data?.error?.message || 'Failed to generate AI prediction', 500);
  }
});

export const smartPricing = asyncHandler(async (req, response) => {
  const { restaurantId } = req.body;
  const menuItems = await MenuItem.find({ restaurantId, isAvailable: true });
  
  if (menuItems.length === 0) throw new AppError('No menu items found', 404);

  const menuData = menuItems.map(m => ({ id: m._id, name: m.name, currentPrice: m.price, category: m.category }));

  const prompt = `
    You are an AI restaurant pricing consultant.
    Here is the current active menu for a restaurant:
    ${JSON.stringify(menuData)}

    Analyze these items. Based on general market trends, suggest optimized pricing for each item to maximize profit while retaining customers.
    Output strictly in this JSON format:
    {
      "recommendations": [
        { "id": "item_id", "name": "Item Name", "suggestedPrice": 0, "reason": "brief reason" }
      ]
    }
  `;

  if (!process.env.OPENAI_API_KEY) throw new AppError('OpenAI API Key is missing', 500);

  try {
    const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const output = JSON.parse(aiRes.data.choices[0].message.content);
    res.success(response, { data: output });
  } catch (error) {
    throw new AppError(error.response?.data?.error?.message || 'AI pricing failed', 500);
  }
});

export const recommendFood = asyncHandler(async (req, response) => {
  const { restaurantId, pastOrdersContext } = req.body; // pastOrdersContext could be strings of items they ordered before
  
  const menuItems = await MenuItem.find({ restaurantId, isAvailable: true });
  const menuData = menuItems.map(m => ({ id: m._id, name: m.name, description: m.description, price: m.price }));

  const prompt = `
    You are an AI food recommendation engine for a customer app.
    Restaurant Menu: ${JSON.stringify(menuData)}
    Customer's past order context (if any, otherwise assume new customer): ${pastOrdersContext || 'None'}

    Pick exactly 3 items from the menu to recommend to this customer right now. 
    Explain why in a catchy, appetizing way (1 sentence per item).
    Output strictly in this JSON format:
    {
      "picks": [
        { "id": "item_id", "name": "Item Name", "reason": "Why they will love it" }
      ]
    }
  `;

  if (!process.env.OPENAI_API_KEY) throw new AppError('OpenAI API Key is missing', 500);

  try {
    const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const output = JSON.parse(aiRes.data.choices[0].message.content);
    res.success(response, { data: output });
  } catch (error) {
    throw new AppError('AI recommendation failed', 500);
  }
});

// semantic Menu Search
export const searchMenu = asyncHandler(async (req, response) => {
  const { restaurantId, query } = req.body;
  
  if (!query || !restaurantId) {
    return res.error(response, 400, 'Missing restaurantId or query');
  }

  // resolve slug/name to ObjectId if needed
  let actualRestaurantId = restaurantId;
  const isObjectId = mongoose.Types.ObjectId.isValid(restaurantId) && String(restaurantId).length === 24;
  
  if (!isObjectId) {
    let restaurant;
    if (restaurantId === 'lassi-lounge') {
      restaurant = await Restaurant.findOne({ name: { $regex: /^lassi lounge$/i } });
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantId });
    }
    
    if (!restaurant) {
      return res.notFound(response, 'Restaurant not found');
    }
    actualRestaurantId = restaurant._id;
  }

  // 1. Fetch full menu items for this restaurant
  const items = await MenuItem.find({ restaurantId: actualRestaurantId, isAvailable: true });
  console.log(`[AI Search] actualRestaurantId: ${actualRestaurantId}, items found: ${items?.length}`);
  if (!items || items.length === 0) {
    return res.success(response, { data: [] });
  }

  // 2. Direct string matching (Fast & Reliable)
  const lowerQuery = query.toLowerCase();
  const directMatches = items.filter(i => 
    i.name.toLowerCase().includes(lowerQuery) || 
    (i.description && i.description.toLowerCase().includes(lowerQuery)) ||
    (i.tags && i.tags.some(t => t.toLowerCase().includes(lowerQuery)))
  );

  if (directMatches.length > 0) {
    return res.success(response, { data: directMatches });
  }

  // 3. Fallback to OpenAI Semantic Search
  const simplifiedMenu = items.map(i => ({
    id: i._id.toString(),
    name: i.name,
    description: i.description || '',
    tags: i.tags || []
  }));

  const prompt = `
    You are an AI semantic search engine for a restaurant menu.
    The user searched for: "${query}"
    
    IMPORTANT: The user's query might be in English, Hindi, or Hinglish. 
    Translate their intent internally. For example:
    - "kuch meetha" or "mithai" means "something sweet" or "dessert".
    - "kuch namkeen" means "salty", "savory", or "snacks".
    - "teekha" means "spicy".
    
    Here is the restaurant menu in JSON format:
    ${JSON.stringify(simplifiedMenu)}
    
    Return the IDs of the items that semantically match the user's query.
    Order the results by relevance. Return maximum 10 items.
    
    Output strictly in this JSON format:
    {
      "results": ["id1", "id2", "id3"]
    }
  `;

  if (!process.env.OPENAI_API_KEY) {
    return res.success(response, { data: [] }); // graceful fallback
  }

  try {
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
    const parsed = JSON.parse(resultText);
    
    if (parsed.results && parsed.results.length > 0) {
      const matchedItems = parsed.results
        .map(id => items.find(i => i._id.toString() === id))
        .filter(i => i != null);
      res.success(response, { data: matchedItems });
    } else {
      res.success(response, { data: [] });
    }
  } catch (error) {
    console.error('AI Search Error:', error.response?.data || error.message);
    res.success(response, { data: [] }); // Return empty array on failure instead of crashing the app
  }
});
