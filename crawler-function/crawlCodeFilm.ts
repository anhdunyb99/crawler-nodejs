import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";
import { createObjectCsvWriter } from "csv-writer";
let dom: JSDOM; // Đặt biến dom ở ngoài hàm crawlWebsite

export async function crawlCodeFilm() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://madouqu.com/tags/");

  const pageContent = await page.content();

  dom = new JSDOM(pageContent);

  
}
