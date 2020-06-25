'use strict';

const request = require('request-promise-native');
const _ = require('lodash');

module.exports = async(event, context, callback) => {
  const getDefaultHeaders = () => {
    return {  
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Connection": "keep-alive",
      "Content-Type": "application/json",
      "Host": "utas.external.s2.fut.ea.com",
      "Origin": "https://www.easports.com",
      "Referer": "https://www.easports.com/fifa/ultimate-team/web-app/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac,OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
      "X-UT-SID": event["X-UT-SID"]
    }
  };

  const moveToPileTrade = async () => {
    const url = `https://utas.external.s2.fut.ea.com/ut/game/fifa20/item`;

    const itemData = {
      "itemData": [
        {
          id: event.cheapestPlayerData.id,
          pile: "trade"
        }
      ]
    }

    const options = {
      method: 'PUT',
      url,
      headers: getDefaultHeaders(),
      gzip: true,
      json: itemData
    };
  
    return await request(options);
  }

  const sellPlayer = async () => {
    const url = `https://utas.external.s2.fut.ea.com/ut/game/fifa20/auctionhouse`;

    const price = (event.cheapestPlayerData.price * 1.05) + 100
    const finalPrice = Math.ceil(price/100)*100

    const itemData = {
      "itemData": {
        "id": event.cheapestPlayerData.id
      },
      "startingBid": event.cheapestPlayerData.price,
      "duration": 3600,
      "buyNowPrice": event.cheapestPlayerData.sellPrice
    }

    const options = {
      method: 'POST',
      url,
      headers: getDefaultHeaders(),
      gzip: true,
      json: itemData
    };
  
    return await request(options);
  }

  const moveToPileResponse = await moveToPileTrade();
  const sellPlayerResponse = await sellPlayer();

  return callback(null, sellPlayerResponse);
};
