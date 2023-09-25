import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";
import { createObjectCsvWriter } from "csv-writer";
let dom: JSDOM;
let browser: any;
let page: any;

async function initializeBrowserAndPage() {
  browser = await puppeteer.launch();
  page = await browser.newPage();
}

export async function collectLinkFromNavBar() {
  await initializeBrowserAndPage();
  await page.goto("https://91md.me/");
  const pageContent = await page.content();
  dom = new JSDOM(pageContent);

  const webElements = dom.window.document.querySelectorAll(
    ".detail_left .nav-link "
  );

  const websiteUrl: string[] = [];
  webElements.forEach((element) => {
    websiteUrl.push((element as HTMLAnchorElement).href);
  });
  await browser.close();

  const domain = "https://91md.me/";
  const result: string[] = websiteUrl.map((element) => {
    return domain.concat(element);
  });

  result.shift(); //Delete homepage url
  return result;
}

export async function crawlDataFromSinglePage(url: string) {
  console.log(url);

  await initializeBrowserAndPage();
  await page.goto(url, { timeout: 90000 });
  const pageContent = await page.content();
  dom = new JSDOM(pageContent);

  const imgElements = await page.$$("li img");
  //Get movie title
  let movieTitle: string[] = [];
  for (const imgElement of imgElements) {
    const altAttributeValue = await imgElement.evaluate((element: any) => {
      return element.getAttribute("alt");
    });
    movieTitle.push(altAttributeValue);
  }

  // Get movie code and actor name from movie title
  const data = movieTitle.map((element) => {
    const parts = element.split(".");
    if (parts.length >= 3) {
      return parts[1] + "." + parts[2];
    } else {
      return null;
    }
  });
  const domain = "https://91md.me/";
  const nextPageURL = await page.evaluate((domain: string) => {
    const nextPageLink = document.querySelector('a[title="下一页"]');
    if (nextPageLink) {
      return domain + nextPageLink.getAttribute("href");
    }
    return null;
  }, domain);
  await browser.close();
  return {
    data,
    nextPageURL,
  };
}

export async function crawlDataFromSingleStudio(url: string) {
  let result = await crawlDataFromSinglePage(url);
  let data: string[] = result.data.filter((item) => item !== null) as string[];
  let checkedPageUrl: string[] = [];

  while (result.nextPageURL) {
    if (typeof result.nextPageURL === "string") {
      if (checkedPageUrl.includes(result.nextPageURL)) {
        break;
      }

      checkedPageUrl.push(result.nextPageURL);
      result = await crawlDataFromSinglePage(result.nextPageURL);
      data.push(...(result.data.filter((item) => item !== null) as string[]));
    } else {
      break;
    }
  }
  return data;
}

export async function crawlAllFrom91Md() {
  const studioUrls = await collectLinkFromNavBar();
  let data: string[] = [];
  for (const studioUrl of studioUrls) {
    let newData = await crawlDataFromSingleStudio(studioUrl);
    data.push(...newData);
  }
  /* for (let index = 0; index < 3; index++) {
    data = await crawlDataFromSingleStudio(studioUrls[index]);
  } */
  /* data = await crawlDataFromSingleStudio(
    "https://91md.me/index.php/vod/type/id/26.html"
  ); */
  const actorMap: any = {};

  data.forEach((item) => {
    const [codeName, actorName] = item.split(".");
    if (!actorMap[actorName]) {
      actorMap[actorName] = [];
    }
    actorMap[actorName].push(codeName);
  });

  const records: any = [];

  for (const actorName in actorMap) {
    records.push({
      actorName,
      codeName: actorMap[actorName].join(", "),
    });
  }

  const csvWriter = createObjectCsvWriter({
    path: "csv/91md_code_film.csv",
    header: [
      { id: "actorName", title: "Actor Name" },
      { id: "codeName", title: "Code Name" },
    ],
  });
  await csvWriter.writeRecords(records);
}

export async function test() {
  const data = [
    "MKY-SV-007.白靖寒",
    "MM-051.台湾第一女优吴梦梦",
    "MKY-SL-007.白靖寒",
    "MD-0225.玥可岚",
    "MDX-0241-04.玥可岚",
    "MCY-0045.白靖寒",
    "MM-050.台湾第一女优吴梦梦",
  ];

  const actorMap: any = {};

  data.forEach((item) => {
    const [codeName, actorName] = item.split(".");
    if (!actorMap[actorName]) {
      actorMap[actorName] = [];
    }
    actorMap[actorName].push(codeName);
  });

  const records: any = [];

  for (const actorName in actorMap) {
    records.push({
      actorName,
      codeName: actorMap[actorName].join(", "),
    });
  }
  console.log(records);
  const csvWriter = createObjectCsvWriter({
    path: "csv/91code.csv",
    header: [
      { id: "actorName", title: "Actor Name" },
      { id: "codeName", title: "Code Name" },
    ],
  });

  await csvWriter.writeRecords(records);
}
