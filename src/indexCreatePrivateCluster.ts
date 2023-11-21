import { createCluster } from '@spore-sdk/core';
import { createDefaultLockWallet } from './wallet';

export async function main() {
    const wallet = createDefaultLockWallet('0xd5d8fe30c6ab6bfd2c6e0a940299a1e01a9ab6b8a8ed407a00b130e6a51435fc');
    let { txSkeleton } = await createCluster({
        data: {
            name: 'ohayou',
            description: '',
        },
        toLock: wallet.lock,
        fromInfos: [wallet.address],
    });
    const hash = await wallet.signAndSendTransaction(txSkeleton)
    console.log(`Cluster created at: https://pudge.explorer.nervos.org/transaction/${hash}`);
}

main()
