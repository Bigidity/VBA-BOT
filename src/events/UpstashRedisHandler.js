require('dotenv').config();
const { createClient } = require("redis");

const client = createClient ({
    url : `rediss://default:${process.env.RD_TOKEN}@REDACTED`
});

async function GetKeyContents(key) {
    try {
      const value = await redis.get(key);
      console.log("Key Value:", value);
      return value;
    } catch (error) {
      console.error("Error fetching key:", error);
   throw error;
   }
};

async function SetDataToKey(key, newData, method) {
    try {
      let response;
      switch (method.toLowerCase()) {
        case 'string':
          response = await redis.set(key, newData.toString());
          break;
        
        case 'number':
          // Set as string since Redis stores numbers as strings, but parse it when needed
          response = await redis.set(key, newData.toString());
          break;
        
        case 'json':
          response = await redis.set(key, JSON.stringify(newData));
          break;
        
        case 'hash':
          if (typeof newData !== 'object' || Array.isArray(newData)) {
            throw new Error("Hash method requires an object");
          }
          // `hmset` or `hset` command to set hash fields
          response = await redis.hset(key, newData);
          break;
        
        case 'stream':
          // Streams often need a stream key, so we use a timestamp or a unique ID.
          const entryId = '*';  // Redis will auto-generate an ID if you use '*'
          response = await redis.xadd(key, entryId, newData);
          break;
        
        default:
          throw new Error("Unsupported method. Use 'string', 'number', 'json', 'hash', or 'stream'.");
      }
      
      console.log("Data set successfully:", response);
      return response;
    } catch (error) {
      console.error("Error setting data:", error);
      throw error;
    }
};

async function SetHashField(key, fieldName, newFieldData) {
    try {
      // Set the specific field in the hash
      const response = await redis.hset(key, { [fieldName]: newFieldData });
      console.log(`Field ${fieldName} in hash ${key} set to:`, newFieldData);
      return response;
    } catch (error) {
      console.error("Error setting hash field:", error);
      throw error;
    }
};

async function GetHashField(key, fieldName) {
    try {
      // Get the specific field value from the hash
      const value = await redis.hget(key, fieldName);
      console.log(`Value of field ${fieldName} in hash ${key}:`, value);
      return value;
    } catch (error) {
      console.error("Error fetching hash field:", error);
      throw error;
    }
};

module.exports = {
 GetKeyContents,
 SetDataToKey,
 SetHashField,
 GetHashField,
};

client.on("error", function(err) {
    throw err;
  });

client.connect()
