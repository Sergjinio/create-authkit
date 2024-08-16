// Improved Code

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const packagesPath = path.join(__dirname, '../examples');
const packages = fs.readdirSync(packagesPath).filter((file) => {
  return fs.statSync(path.join(packagesPath, file)).isDirectory();
});

const loadPackageData = async (page) => {
  try {
    const response = await axios.get('https://www.npmjs.com/search', {
      params: {
        q: '@particle-network',
        perPage: 20,
        page: page,
        timestamp: Date.now(),
      },
      headers: {
        authority: 'www.npmjs.com',
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        referer: 'https://www.npmjs.com/search?q=%40particle-network',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': 'macOS',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'none',
        'cf-cache-status': 'DYNAMIC',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'x-spiferack': '1',
      },
    });

    return {
      total: response.data.total,
      results: response.data.objects.map((item) => ({
        name: item.package.name,
        version: item.package.version,
      })),
    };
  } catch (error) {
    throw new Error(`Failed to load package data on page ${page}: ${error.message}`);
  }
};

const updatePackageJson = (pkg, newVersions) => {
  const srcPath = path.join(packagesPath, `./${pkg}/package.json`);
  let packageContent = fs.readFileSync(srcPath, 'utf8');

  newVersions.forEach(({ name, version }) => {
    const reg = new RegExp(`"${name}": ".*?"`, 'g');
    packageContent = packageContent.replace(reg, (substring) => {
      const replacement = `"${name}": "^${version}"`;
      console.log(`${pkg}: ${substring} -> ${replacement}`);
      return replacement;
    });
  });

  fs.writeFileSync(srcPath, packageContent);
};

(async () => {
  console.log('--START--');

  try {
    const newVersions = [];
    const firstPageResponse = await loadPackageData(0);
    newVersions.push(...firstPageResponse.results);

    const totalPackages = firstPageResponse.total;
    const totalPages = Math.ceil(totalPackages / 20);

    if (totalPages > 1) {
      for (let i = 1; i < totalPages; i++) {
        const response = await loadPackageData(i);
        newVersions.push(...response.results);
      }
    }

    packages.forEach((pkg) => {
      updatePackageJson(pkg, newVersions);
    });

  } catch (error) {
    console.error('An error occurred:', error.message);
  }

  console.log('--END--');
})();
