import { createSpore } from '@spore-sdk/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createDefaultLockWallet } from './wallet';

export async function fetchLocalFile(src: string) {
    const buffer = readFileSync(resolve(__dirname, src));
    return new Uint8Array(buffer).buffer;
}

export async function main() {
    const wallet = createDefaultLockWallet('0xd5d8fe30c6ab6bfd2c6e0a940299a1e01a9ab6b8a8ed407a00b130e6a51435fc');
    const { txSkeleton, outputIndex } = await createSpore({
        data: {
            contentType: 'image/jpeg',
            content: await fetchLocalFile('../res/nervos.jpg'),
            clusterId: '0xa47f1c65f2a7f9cfab59d92a28795e1270b0d2f659db016f28694cb3c32a72ed',
        },
        toLock: wallet.lock,
        fromInfos: [wallet.address],
    });
    const hash = await wallet.signAndSendTransaction(txSkeleton);
    console.log(`Spore created at: https://pudge.explorer.nervos.org/transaction/${hash}`);
    console.log(`Spore ID: ${txSkeleton.get('outputs').get(outputIndex)!.cellOutput.type!.args}`);
}

main()
