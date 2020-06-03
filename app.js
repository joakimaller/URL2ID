const { Cluster } = require('puppeteer-cluster');
const fs = require('file-system');
const util = require('util');
const readFile = util.promisify(fs.readFile);

(async () => {
    const workersAmount = 6;
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: workersAmount,
    });
    console.log(`🌈 Spawning ${workersAmount} workers`);
    

    let ids =[];
    
    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url);
        const classes = await page.evaluate(() => document.querySelector('body').classList);
        const classPostId = Object.values(classes).filter( item => item.match(/^postid/) );
        if(classPostId.length > 0){
            var id = parseInt(classPostId[0].replace('postid-', ''));
            ids.push(id);
        }else{
            console.log("\x1b[31m", `unsuccessful fetching id from ${url} `)
        }
    });
    
    let data = await readFile('./urls.txt', 'utf8')
    const dataArray = data.split("\n")
    console.log(`🔥 Preparing ${dataArray.length} urls to process`);
    dataArray.forEach(url => cluster.queue(url))
    
    const status = setInterval(()=>{console.log(`Processed ${ids.length} of ${dataArray.length}`)}, 5000);
    await cluster.idle();
    await cluster.close()
    clearInterval(status);
    
    fs.writeFile('ids.txt', ids.join(', '), function(){
        console.log(`✅ Processed ${dataArray.length} urls and added them in ids.txt`)
    })
    
})();
