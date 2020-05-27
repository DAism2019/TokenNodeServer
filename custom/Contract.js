const ethers = require('ethers');
const network = process.env.NETWORK || "homestead"
const address = process.env.ADDRESS

const abi = [
    "event CreateToken(address indexed creator,uint256 typeId)",
    "function nonce() view returns(uint256)",
    "function getTypeSVG(uint256 _nonce) view returns(string)"
]

const net = network === "mainnet" ? "homestead" : network
const provider = network === "localhost" ? new ethers.providers.JsonRpcProvider("http://localhost:8545") :ethers.getDefaultProvider(net)
let contract = null

try {
    contract = new ethers.Contract(address, abi, provider);
}catch(err) {
    console.log("合约初始化失败!")
}



module.exports = contract