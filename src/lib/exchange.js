import { getWithExpiry, setWithExpiry } from './localstorage-cache';
import { API_KEY, SECRET_KEY } from './credential';

let binanceApi;

export async function getMarketsData() {
  binanceApi = binanceApi || new window.ccxt.binance({
    'apiKey': API_KEY,
    'secret': SECRET_KEY
  });
  let marketsData = getWithExpiry('marketsData');
  if (!marketsData) {
    marketsData = await binanceApi.loadMarkets();
    setWithExpiry('marketsData', marketsData, 1000 * 60 * 5);
  }

  return marketsData;
}

export async function getTickersData() {
  binanceApi = binanceApi || new window.ccxt.binance({
    'apiKey': API_KEY,
    'secret': SECRET_KEY
  });
  let tickersData = getWithExpiry('tickersData');
  if (!tickersData) {
    tickersData = await binanceApi.fetchTickers();
    setWithExpiry('tickersData', tickersData, 1000 * 60 * 30);
  }

  return tickersData;
}

export async function makeTriangularOrder(pair_1, pair_2, pair_3) {
  binanceApi = binanceApi || new window.ccxt.binance({
    'apiKey': API_KEY,
    'secret': SECRET_KEY
  });

  var params = {
    //'test': true
  };

  var transaction_failed = false;

  var market = pair_1.market;
  var side = pair_1.side;
  var amount = pair_1.amount;
  var price = pair_1.price;
  var target = 0;
  var target_currency = "";
  var market_splitted = [];

  const PERCENTAGE_BUYING_RISK = 0.01;

  console.log("Transaction Summary");
  console.log(pair_1);
  console.log(pair_2);
  console.log(pair_3);

  console.log("Transaction #1");
  const first_order = await binanceApi.createOrder(market, 'limit', side, 
    amount, price, params);
  console.log("First order has been finished");
  console.log(first_order);

  if (first_order["status"] == "open") {
    console.log("Order was not successful");
    transaction_failed = true;
    return;
  }

  var balance = await binanceApi.fetchBalance();
  target = (side == "buy") ? first_order.filled : first_order.cost;
  market = pair_2.market;
  market_splitted = market.split("/");
  amount = pair_2.amount;
  price = pair_2.price;
  side = pair_2.side;
  
  target_currency = (side == "buy") ? market_splitted[1] : market_splitted[0];
  if (side == "sell") {
    amount = balance[target_currency]["free"];
  } else {
    //amount = amount * (1 - PERCENTAGE_BUYING_RISK);
  } 

  console.log("Transaction #2");
  console.log("Try to collect " + target_currency + " by " + side);
  console.log("Amount : " + amount);
  const second_order = await binanceApi.createOrder(market, 'market', side,
    amount, price);
  console.log(second_order);

  balance = await binanceApi.fetchBalance();
  target = (side == "buy") ? second_order.filled : second_order.cost;
  market = pair_3.market;
  market_splitted = market.split("/");
  side = pair_3.side;
  amount = pair_3.amount;
  price = pair_3.price;
  target_currency = (side == "buy") ? market_splitted[1] : market_splitted[0];

  if (side == "sell") {
    amount = balance[target_currency]["free"];
  } else {
    //amount = amount * (1 - PERCENTAGE_BUYING_RISK);
  }

  console.log("Transaction #3");
  console.log("Try to collect " + target_currency + " by " + side);
  console.log("Amount : " + amount);
  const third_order = await binanceApi.createOrder(market, 'market', side,
    amount, price);
  console.log(third_order);
}
