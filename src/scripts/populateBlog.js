// https://gist.github.com/crazy4groovy/65e97b035c4fc7fdb6982c96538c29dc
//

import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import { parse as parseCsv } from "csv-parse/sync";
import slugify from "slugify";
// import marked from 'https://cdn.skypack.dev/marked';

const destFolder = "/src/pages/blog";

async function readSheet(
  key,
  sheetName = "Sheet1",
  format = "csv" /* "json" not recommended! */
) {
  const url = `https://docs.google.com/spreadsheets/d/${key}/gviz/tq?tqx=out:${format}&sheet=${sheetName}`;
  return fetch(url).then((r) => r.text());
}

const postsCsv = await readSheet(
  "?????????????????-??????", // "1nXQhrRFIt92LTiKHFWQ9YezjbgdbLqDM-8LSzQVDhEQ", // URL
  "Posts", // name of tab
);

const posts = await parseCsv(postsCsv);
//console.log(posts);

posts.shift(); // remove header row

const mds = posts.map((p) => {
  // Note: must change these vars, according to your spreadsheet columns!
  let [
    ts,
    title,
    slug = "",
    heroUrl = "",
    pubDate,
    contentMD = "",
    authName = "",
    tags = "",
  ] = p;
  contentMD = contentMD.replace(/\n/g, "\n\n");

  // Note: process the fields as per required
  heroUrl = heroUrl
    .split(",")[0]
    ?.replace(new RegExp("https://betsyolsen.com/wp-content"), "");
  pubDate = new Date(pubDate.split("/").reverse().join("/").replace(" ", ", "))
    .toLocaleString("eng-ca", { hour12: false })
    .replace(", ", " ")
    .replace("24:00:00", "00:00:00");
  console.log("Loaded from Google Sheets:", { slug, title, pubDate });

  // const contentHTML = marked(contentMD)
  // console.log({ ts, title, heroUrl, pubDate, contentMD, contentHTML, slug, authName});

  const fname = (slug || slugify(title, { lower: true, strict: true })) + ".md";
  const postFileMD = `---
layout: "../../layouts/BlogPostLayout.astro"
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
pubDate: "${pubDate}"
heroImage: "${heroUrl}"
tags: ${tags
      ?.split(", ")
      ?.filter(Boolean)
      ?.map((t) => `\n- ${t}`)
      ?.join("")}
${authName ? `author: ${authName}` : ""}
---
${contentMD.replace(/\\n/g, "\n\n")}
`;

  // console.log(path.join(process.cwd(), destFolder, fname), postFileMD, "utf8");

  fs.writeFileSync(path.join(process.cwd(), destFolder, fname), postFileMD, "utf8");

  return postFileMD;
});
