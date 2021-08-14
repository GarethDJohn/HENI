import { describe, beforeEach, afterEach, jest, it, expect } from '@jest/globals';

import { MainController, TokenHolderDetails } from '../../src/controllers/main-controller';

describe('MainController', function() {
    let mainController: MainController;

    describe('getTokenHolderDetails', function() {
        beforeEach(function() {
            mainController = new MainController();
        });

        afterEach(function() {
            jest.restoreAllMocks();
        });

        it('returns token details for a token holder', async function() {
            // Arrange
            jest.spyOn(mainController.covidPunksContract.methods, 'getPunksBelongingToOwner').mockImplementation(() => {
                return async () => {
                    return ['1', '5', '10'];
                };
            });

            // Act
            const tokenHolderId = '0x4F046178C16e696FD3c4d5978425C8f4aF522061';
            const tokenHolderDetails = await mainController.getTokenHolderDetails(tokenHolderId);

            // Assert
            const expected = {
                owner: '0x4F046178C16e696FD3c4d5978425C8f4aF522061',
                count: 3,
                tokenIds: ['1', '5', '10']
            };

            expect(tokenHolderDetails).toEqual(expected);
        });

        it('returns no token details for an id with no tokens', async function() {
            // Arrange
            jest.spyOn(mainController.covidPunksContract.methods, 'getPunksBelongingToOwner').mockImplementation(() => {
                return async () => {
                    return [];
                };
            });

            // Act
            const tokenHolderId = '0x4F046178C16e696FD3c4d5978425C8f4aF522061';
            const tokenHolderDetails = await mainController.getTokenHolderDetails(tokenHolderId);

            // Assert
            const expected = {
                owner: '0x4F046178C16e696FD3c4d5978425C8f4aF522061',
                count: 0,
                tokenIds: []
            };

            expect(tokenHolderDetails).toEqual(expected);
        });

        it('throws an error if the tokenHolderId is invalid', async function() {
            // Arrange
            // no steps required

            // Act
            const tokenHolderId = 'invalidtokenholderid';
            const tokenHolderDetails = mainController.getTokenHolderDetails(tokenHolderId);

            // Assert
            await expect(tokenHolderDetails).rejects.toThrow('invalid address');
        });
    });

    describe('getTokenHolderDetailsForTokenRange', function() {
        beforeEach(function() {
            mainController = new MainController();
        });

        afterEach(function() {
            jest.restoreAllMocks();
        });

        it('returns the holder details of a token', async function() {
            // Arrange
            jest.spyOn(mainController.covidPunksContract.methods, 'ownerOf').mockImplementation((tokenId: any) => {
                return async () => {
                    const owners: any = {
                        '1': '0x1',
                    };
                    return owners[tokenId];
                };
            });
            jest.spyOn(mainController.covidPunksContract.methods, 'getPunksBelongingToOwner').mockImplementation((owner: any) => {
                return async () => {
                    const punksBelongingToOwners: any = {
                        '0x1': ['1'],
                    };
                    return punksBelongingToOwners[owner];
                };
            });

            // Act
            const details = await mainController.getTokenHolderDetailsForTokenRange(1, 1);

            // Assert
            const expected: TokenHolderDetails[] = [
                {
                    owner: '0x1',
                    count: 1,
                    tokenIds: ['1'],
                },
            ];
            expect(details).toEqual(expected);
        });

        it('sorts multiple results in descending order of count of tokens held', async function() {
            // Arrange
            jest.spyOn(mainController.covidPunksContract.methods, 'ownerOf').mockImplementation((tokenId: any) => {
                return async () => {
                    const owners: any = {
                        '1': '0x1',
                        '2': '0x2',
                        '3': '0x3',
                    };
                    return owners[tokenId];
                };
            });
            jest.spyOn(mainController.covidPunksContract.methods, 'getPunksBelongingToOwner').mockImplementation((owner: any) => {
                return async () => {
                    const punksBelongingToOwners: any = {
                        '0x1': ['1', '2'],
                        '0x2': ['3', '4', '5'],
                        '0x3': ['6'],
                    };
                    return punksBelongingToOwners[owner];
                };
            });

            // Act
            const details = await mainController.getTokenHolderDetailsForTokenRange(1, 3);

            // Assert
            const expected: TokenHolderDetails[] = [
                {
                    owner: '0x2',
                    count: 3,
                    tokenIds: ['3', '4', '5'],
                },
                {
                    owner: '0x1',
                    count: 2,
                    tokenIds: ['1', '2'],
                },
                {
                    owner: '0x3',
                    count: 1,
                    tokenIds: ['6'],
                },
            ];
            expect(details).toEqual(expected);
        });
    });
});
