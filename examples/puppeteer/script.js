const startTime = Date.now();

const puppeteer = require("puppeteer");
const { startAppServer } = require("../demo-app/server");
const newTrackerClient = require("react-render-tracker/headless-browser-client");

async function runReactScenarioSet(run) {
  const [browser, server] = await Promise.all([
    puppeteer.launch({ headless: "new" }),
    startAppServer(),
  ]);

  await run(async function runReactScenario(url, scenario) {
    const page = await browser.newPage();
    const rrt = await newTrackerClient(page);

    await page.goto(new URL(url, server.host).href);
    await scenario({ browser, page, rrt });
    await page.close();
  });

  await browser.close();
  await server.close();
}

runReactScenarioSet(async runReactScenario => {
  await runReactScenario("/", async ({ page, rrt }) => {
    const eventCountBeforeAction = await rrt.getEventCount();

    // do some actions
    await page.click("button");

    // dump events after an action
    console.log(await rrt.getEvents(eventCountBeforeAction));
  });

  console.log("DONE in", Date.now() - startTime, "ms");
});
