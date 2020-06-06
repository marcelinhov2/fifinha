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

  const sleep = (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

  const playerSearch = async (start = 0, num = 21) => {
    const url = `https://utas.external.s2.fut.ea.com/ut/game/fifa20/transfermarket?start=0&num=21&type=player&maskedDefId=${event.player.maskedDefId}&maxb=${event.search.maxb}&macr=${Math.floor(Math.random() * event.search.maxb) + 1}`;

    const options = {
      method: 'GET',
      url,
      headers: getDefaultHeaders(),
      gzip: true
    };
  
    return await request(options);
  }

  const buyPlayer = async (cheapestPlayer) => {
    const url = `https://utas.external.s2.fut.ea.com/ut/game/fifa20/trade/${cheapestPlayer.tradeId}/bid`;

    const options = {
      method: 'PUT',
      url,
      headers: getDefaultHeaders(),
      gzip: true,
      json: {
        bid: cheapestPlayer.price
      }
    };

    return await request(options);
  }

  const playerSearchResults = await playerSearch();
  const parsedResults = JSON.parse(playerSearchResults);

  if(!parsedResults.auctionInfo.length)
    return callback('no player found')

  const cheapestPlayer = _.minBy(parsedResults.auctionInfo, 'buyNowPrice');

  const cheapestPlayerData = {
    price: cheapestPlayer.buyNowPrice,
    tradeId: cheapestPlayer.tradeId,
    id: cheapestPlayer.itemData.id
  };

  try {
    const result = await buyPlayer(cheapestPlayerData);
    await sleep(10000);

    const response = {
      result,
      cheapestPlayerData,
      event
    }

    return callback(null, response);
  } catch (e) {
    return callback('no player found')
  }
};
