import Web3 from 'web3';
import * as fs from 'fs';
import * as path from 'path';
import { Contract } from 'web3-eth-contract';

export type TokenId = string;
export type TokenHolderId = string;
export type TokenHolderDetails = {
    owner: string;
    count: number;
    tokenIds: TokenId[];
};

const infuraEndpoint = 'https://mainnet.infura.io/v3/f28e787e358a448e9a3d5c082ef0a213';
const covidPunksContractAddress = '0xe4cfae3aa41115cb94cff39bb5dbae8bd0ea9d41';
const covidPunksContractAbi = JSON.parse(fs.readFileSync(path.join(__dirname, 'covid-punks-contract-abi.json'), 'utf8'));

export class MainController {
    covidPunksContract: Contract;

    constructor() {
        const web3 = new Web3(new Web3.providers.HttpProvider(infuraEndpoint));
        this.covidPunksContract = new web3.eth.Contract(covidPunksContractAbi, covidPunksContractAddress);
    }

    /**
     * Get details of a single token holder - the number of tokens they hold, along
     * with the tokenIds.
     * 
     * @param tokenHolderId The id of the token holder to get the details of
     * @returns an object detailing the holdings of the holder
     */
    async getTokenHolderDetails(tokenHolderId: string): Promise<TokenHolderDetails> {
        const tokens = await this.covidPunksContract.methods.getPunksBelongingToOwner(tokenHolderId).call();
        return {
            owner: tokenHolderId,
            count: tokens.length,
            tokenIds: tokens,
        };
    }

    /**
     * Get details of holders of a range of tokens, from start to end inclusive.
     * 
     * @param from start of tokenId range
     * @param to end of tokenId range
     * @returns an array of TokenHolderDetails, sorted in descending order of `count`
     */
    async getTokenHolderDetailsForTokenRange(from: number, to: number) {
        if (from > to) {
            throw new Error('from must be <= to');
        }

        const tokenIds: number[] = [];

        for (let i = from; i <= to; i++) {
            tokenIds.push(i);
        }

        const tokenOwners: Set<string> = new Set();

        console.log(`tokenIds: ${tokenIds.join(', ')}`)

        await Promise.all(tokenIds.map(async (tokenId) => {
            const tokenOwner: string = await this.covidPunksContract.methods.ownerOf(tokenId).call();
            tokenOwners.add(tokenOwner);
        }));

        console.log(`tokenOwners: ${JSON.stringify(Array.from(tokenOwners.values()))}`)

        const details = await Promise.all(
            Array.from(tokenOwners.values()).map(async (tokenOwner) => {
                return this.getTokenHolderDetails(tokenOwner);
            })
        );

        details.sort((a, b) => {
            return b.count - a.count;
        });

        return details;
    }
}
