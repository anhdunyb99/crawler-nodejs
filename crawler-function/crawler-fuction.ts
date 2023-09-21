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
export async function crawlActorName() {
  await initializeBrowserAndPage();
  await page.goto("https://madouqu.com/tags/");
  const pageContent = await page.content();
  dom = new JSDOM(pageContent);

  const webElements = dom.window.document.querySelectorAll(".tagslist .name");
  const actorName: string[] = [];
  webElements.forEach((element) => {
    actorName.push(element.textContent!.trim());
  });
  await browser.close();
  return actorName;
}
export async function crawlUrlActorListFilm() {
  await initializeBrowserAndPage();
  await page.goto("https://madouqu.com/tags/");
  const pageContent = await page.content();
  dom = new JSDOM(pageContent);

  const webElements = dom.window.document.querySelectorAll(".tagslist .name ");
  const websiteUrl: string[] = [];
  webElements.forEach((element) => {
    websiteUrl.push((element as HTMLAnchorElement).href);
  });
  await browser.close();
  return websiteUrl;
}
export async function crawlCodeFilm(nextPageUrl: any) {
  await initializeBrowserAndPage();
  const code: string[] = [];

  while (nextPageUrl) {
    await page.goto(nextPageUrl);
    const listFilmContent = await page.content();
    dom = new JSDOM(listFilmContent);
    const webElement1 = dom.window.document.querySelectorAll(".entry-title");
    webElement1.forEach((element) => {
      const filmName = element.textContent!.trim();
      const spaceIndex = filmName.indexOf(" ");
      if (spaceIndex !== -1) {
        const firstName = filmName.substring(0, spaceIndex);
        code.push(firstName);
      }
    });

    const nextPageButton = await page.$(".next.page-numbers");
    if (nextPageButton) {
      nextPageUrl = await nextPageButton.evaluate(
        (element: HTMLElement | null) => {
          if (element) {
            return element.getAttribute("href");
          } else {
            return null;
          }
        }
      );
    } else {
      nextPageUrl = null;
    }
  }

  await browser.close();
  return code;
  /* let actorName = "Alex";
  const csvWriter = createObjectCsvWriter({
    path: "csv/code_film.csv",
    header: [
      { id: "actorName", title: "Actor Name" },
      { id: "code", title: "Code film" },
    ],
  });

  const records = code.map((code) => ({
    actorName: actorName,
    code: code,
  }));
  await csvWriter.writeRecords(records); */
}

export async function crawlAll() {
  try {
    process.setMaxListeners(20);
    const listUrl: string[] = await crawlUrlActorListFilm();
    const promises = listUrl.map((url) => crawlCodeFilm(url));
    const listCodeFilm: any[] = await Promise.all(promises);
    console.log(listCodeFilm);

    let actorName = "Alex";
    const csvWriter = createObjectCsvWriter({
      path: "csv/code_film.csv",
      header: [
        { id: "actorName", title: "Actor Name" },
        { id: "code", title: "Code film" },
      ],
    });

    const records = listCodeFilm.map((code) => ({
      actorName: actorName,
      code: code,
    }));
    await csvWriter.writeRecords(records);

    return listCodeFilm;
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error(error);
    return [];
  }
}
