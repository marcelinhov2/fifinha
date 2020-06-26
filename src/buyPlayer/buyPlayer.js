'use strict';

const request = require('request-promise-native');
const _ = require('lodash');
const sellPlayer = require('../sellPlayer/sellPlayer')

module.exports = async(event, context, callback) => {
  const serialize = (obj) => (Object.entries(obj).map(i => [i[0], encodeURIComponent(i[1])].join('=')).join('&'))
  
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

  const playerSearch = async (transaction) => {
    const macr = (Math.floor((Math.random() + transaction.search.maxb) * 15 + 10)) * 100;
    const url = `https://utas.external.s2.fut.ea.com/ut/game/fifa20/transfermarket?${serialize(transaction.search)}&macr=${macr}`;

    console.log('transaction: ', JSON.stringify(transaction))

    const options = {
      method: 'GET',
      url,
      headers: getDefaultHeaders(),
      gzip: true,
      proxy: 'http://lum-customer-marcelo_andrade-zone-rapidapi:mu0j9cfmicgh@zproxy.luminati.io:22225'
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
      },
      proxy: 'http://lum-customer-marcelo_andrade-zone-rapidapi:mu0j9cfmicgh@zproxy.luminati.io:22225'
    };

    return await request(options);
  }

  const action = async () => {
    console.log('-----------------------------------------------------');
    const clone = _.clone(event.transactions)
    const transaction = _.sample(clone);

    const sleepTime = (Math.floor((Math.random()) * 30 + 20)) * 100;
    // const sleepTime = 1000;
    await sleep(sleepTime);

    const playerSearchResults = await playerSearch(transaction);
    const parsedResults = JSON.parse(playerSearchResults);

    if(!parsedResults.auctionInfo.length) {
      console.log('no player found')
      return await action();
    }

    const cheapestPlayer = _.minBy(parsedResults.auctionInfo, 'buyNowPrice');

    const cheapestPlayerData = {
      price: cheapestPlayer.buyNowPrice,
      tradeId: cheapestPlayer.tradeId,
      id: cheapestPlayer.itemData.id,
      sellPrice: transaction.sellPrice
    };

    console.log('ENCONTRADO: ', cheapestPlayerData)

    try {
      const buyPlayerResult = await buyPlayer(cheapestPlayerData);

      console.log('BuyPlayerResult: ', JSON.stringify(buyPlayerResult))

      const response = {
        "X-UT-SID": event["X-UT-SID"],
        cheapestPlayerData: cheapestPlayerData
      }

      console.log('COMPRADO: ', JSON.stringify(response))

      await sleep(sleepTime);

      try {
        await sellPlayer(response, {}, (result) => {
          console.log('ANUNCIADO: ', cheapestPlayerData)
        });
      } catch (e) {
        console.log('::::::::::::::::')
        console.log('ERRO AO ANUNCIAR: ', cheapestPlayerData)
        console.log(e)
        console.log('::::::::::::::::')
      }

      // return callback(null, response);
    } catch (e) {
      console.log('no player buyed')
      // return callback('no player buyed')
    }

    return await action();
  }

  await action();
};
