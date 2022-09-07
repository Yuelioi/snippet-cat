async function uploadFiles(loaclFolderPath, syncFolderPath) {
  const localItems = fs.readdirSync(loaclFolderPath);

  localItems.forEach(async function (localFileName) {
    let localFullPath = path.resolve(loaclFolderPath, localFileName);
    let syncFullPath = path.join(syncFolderPath, localFileName).split(path.sep).join("/");



    let isFolder = folderExists(localFullPath);
    if (!isFolder) {
      console.log(localFullPath);
      let localStuts = fs.stat(localFullPath, async(err, stat) => {
        let syncModTime = 0;
        const localModTime = stat.mtimeMs;

        if (await client.exists(syncFullPath) === true) {
          const syncStuts = await client.stat(syncFullPath);
          syncModTime = new Date(syncStuts.lastmod).getTime();
        }

        if (localModTime !== syncModTime) {
          fs.readFile(localFullPath, 'utf8', async function (err, data) {
            await client.putFileContents(syncFullPath, data, { overwrite: true });
          });
        }
      });


    } else {
      console.log("124124" + localFullPath);
      if (await client.exists(syncFullPath) === false) {
        await client.createDirectory(syncFullPath);
      }
      uploadFiles(localFullPath, syncFullPath);
    }
  });

  
  const syncRes = await client.getDirectoryContents(syncFolderPath);
  const syncItems =  syncRes.map(x => x.basename);

  let diffItems = syncItems.filter(x => !localItems.includes(x));


  diffItems.forEach(async (x) =>{
    await client.deleteFile(syncFolderPath + "/" + x);
  });

}
uploadFiles("H:/Snippets/Snippet Cat", "/Snippet Cat");