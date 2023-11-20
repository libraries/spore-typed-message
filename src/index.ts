import { createSpore, createCluster } from '@spore-sdk/core';
import { createDefaultLockWallet, fetchLocalFile } from './helpers';

// Docs:
//   [1] https://docs.spore.pro/
//   [2] https://a-simple-demo.spore.pro/spore/

async function mainCreateSpore() {
  const wallet = createDefaultLockWallet('0xd5d8fe30c6ab6bfd2c6e0a940299a1e01a9ab6b8a8ed407a00b130e6a51435fc');
  const { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType: 'image/jpeg',
      content: await fetchLocalFile('./image.jpg'),
    },
    toLock: wallet.lock,
    fromInfos: [wallet.address],
  });
  const hash = await wallet.signAndSendTransaction(txSkeleton);
  console.log(`Spore created at: https://pudge.explorer.nervos.org/transaction/${hash}`);
  console.log(`Spore ID: ${txSkeleton.get('outputs').get(outputIndex)!.cellOutput.type!.args}`);
}

async function mainCreateImmortalSpore() {
  const wallet = createDefaultLockWallet('0xd5d8fe30c6ab6bfd2c6e0a940299a1e01a9ab6b8a8ed407a00b130e6a51435fc');
  let { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType: 'image/jpeg',
      content: await fetchLocalFile('./image.jpg'),
      contentTypeParameters: {
        immortal: true,
      },
    },
    toLock: wallet.lock,
    fromInfos: [wallet.address],
  });
  const hash = await wallet.signAndSendTransaction(txSkeleton);
  console.log(`Spore created at: https://pudge.explorer.nervos.org/transaction/${hash}`);
  console.log(`Spore ID: ${txSkeleton.get('outputs').get(outputIndex)!.cellOutput.type!.args}`);
}

async function mainCreatePrivateCluster() {
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

async function mainCreateSporeWithCluster() {
  const wallet = createDefaultLockWallet('0xd5d8fe30c6ab6bfd2c6e0a940299a1e01a9ab6b8a8ed407a00b130e6a51435fc');
  const { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType: 'image/jpeg',
      content: await fetchLocalFile('./image.jpg'),
      clusterId: '0xa47f1c65f2a7f9cfab59d92a28795e1270b0d2f659db016f28694cb3c32a72ed',
    },
    toLock: wallet.lock,
    fromInfos: [wallet.address],
  });
  const hash = await wallet.signAndSendTransaction(txSkeleton);
  console.log(`Spore created at: https://pudge.explorer.nervos.org/transaction/${hash}`);
  console.log(`Spore ID: ${txSkeleton.get('outputs').get(outputIndex)!.cellOutput.type!.args}`);
}

// mainCreateSpore()
// mainCreateImmortalSpore()
// mainCreatePrivateCluster()
// mainCreateSporeWithCluster()

import { hd, helpers, RPC } from '@ckb-lumos/lumos';
async function main() {
  let privateKey = '0xd5d8fe30c6ab6bfd2c6e0a940299a1e01a9ab6b8a8ed407a00b130e6a51435fc'
  const wallet = createDefaultLockWallet(privateKey);
  let r = wallet.signMessage("0x00")
  console.log(r)
}

main()
