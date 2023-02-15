import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as https from 'https';
import pdfkit from 'pdfkit';
const link = 'https://dominio-manga-sebas.com/manga/el-regreso-del-heroe';
const pathFolderImg = './images/el-regreso-del-heroe';
const pathFolderPdf = './pdfs/el-regreso-del-heroe';
const cantCaps = 48;

getManga();

async function getManga() {
  for (let i = 1; i <= cantCaps; i++) {
    if (!fs.existsSync(`${pathFolderImg}/capitulo-${i}`)) {
      console.log(`Creando carpeta capitulo-${i}`);
      fs.mkdirSync(`${pathFolderImg}/capitulo-${i}`, { recursive: true });
    }
    const imgs = await getImgsFromLink(`${link}/capitulo-${i}/`);
    imgs.forEach((img, index) => {
      console.log(`Cargando imagen ${index} capitulo ${i}`);
      const file = fs.createWriteStream(`${pathFolderImg}/capitulo-${i}/img-${index}.jpeg`);
      const request = https.get(img || '', function (response) {
        response.pipe(file);
      });

      request.on('error', function (err) {
        console.log(err);
      });

      file.on('finish', function () {
        file.close();
      });

      file.on('error', function (err) {
        console.log(err);
      });
    });
  }
  if (!fs.existsSync(`${pathFolderPdf}`)) {
    fs.mkdirSync(`${pathFolderPdf}`, { recursive: true });
  }
  for (let i = 1; i <= cantCaps; i++) {
    console.log('Capitulo a PDF:  ', i);
    const imgs = fs.readdirSync(`${pathFolderImg}/capitulo-${i}`);
    var pdfDoc = new pdfkit({
      margin: 0,
    });
    pdfDoc.pipe(fs.createWriteStream(`${pathFolderPdf}/capitulo-${i}.pdf`));
    imgs.forEach((img, index) => {
      console.log('Imagen a PDF:  ', img);
      if (fs.existsSync(`${pathFolderImg}/capitulo-${i}/img-${index}.jpeg`)) {
        if (index < 2) {
          pdfDoc.image(`${pathFolderImg}/capitulo-${i}/img-${index}.jpeg`, {
            fit: [600, 400],
            align: 'center',
            valign: 'center',
          });
        } else {
          pdfDoc.addPage().image(`${pathFolderImg}/capitulo-${i}/img-${index}.jpeg`, 210, 0, {
            align: 'center',
            valign: 'center',
            height: 800,
          });
        }
      }
    });
    pdfDoc.end();
  }
}

async function getImgsFromLink(link: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(link);
  const imgs = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img.wp-manga-chapter-img');
    const imgsArray = Array.from(imgs);
    return imgsArray.map((img) => img.getAttribute('src'));
  });
  await browser.close();
  return imgs;
}
