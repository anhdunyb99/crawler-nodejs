import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";
import { createObjectCsvWriter } from "csv-writer";
let dom: JSDOM; // Đặt biến dom ở ngoài hàm crawlWebsite

async function crawlWebsite() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://madouqu.com/tags/");

  // Lấy nội dung HTML của trang
  const pageContent = await page.content();

  // Tạo mô phỏng DOM từ nội dung trang
  dom = new JSDOM(pageContent);

  // Trích xuất tên các bài báo từ mô phỏng DOM
  const webElements = dom.window.document.querySelectorAll(".tagslist .name");
  const actorName: string[] = [];
  webElements.forEach((element) => {
    actorName.push(element.textContent!.trim());
  });

  await browser.close();
  const csvWriter = createObjectCsvWriter({
    path: "actors_name.csv",
    header: [{ id: "name", title: "Actors name" }],
  });

  const records = actorName.map((name) => ({ name }));
  await csvWriter.writeRecords(records);
}

crawlWebsite();
