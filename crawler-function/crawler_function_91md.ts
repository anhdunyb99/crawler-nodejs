import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";
import { createObjectCsvWriter } from "csv-writer";
let dom: JSDOM; // Đặt biến dom ở ngoài hàm crawlWebsite
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
  await page.goto(url, { timeout: 60000 });
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
  const csvWriter = createObjectCsvWriter({
    path: "csv/91md_code_film.csv",
    header: [{ id: "data", title: "Data" }],
  });

  const records = data.map((data) => ({ data }));
  await csvWriter.writeRecords(records);
}
