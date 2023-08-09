(async () => {
    const configDebug = {
        "lookingForUnitInName": false,
        "beatifulPrice": false,
        "UNITALWAYSONE": false,
    }
    const unitOfProduct = {
        // "kg": 1000,
        // "g": 1,
        // "กิโลกรัม": 1000,
        // "กรัม": 1,
        // "ml": 1,
        // "ลิตร": 1000,
        // "l": 1000,

        // ชนิดของสำลี
        "แผ่น": 1,

    }
    const unitPriceOfProduct = ["฿"]
    const unitPriceFilterOutOfProduct = ["discount", "save"]
    // const titleOfProductsContain = ["nutella", "nutella", "นูเทลล่า", "นูเทล", "โกแลต"]
    // const titleOfProductsContain = ["macbook pro", "512"]
    // const titleOfProductsContain = ["ตู้เย็น" ,"4 ประตู" , "4 door"]
    const titleOfProductsContain = ["เช็ดหน้า"]
    const PRODUCTS = [];
    const PRODUCTSNOTFOUND = [];
    const PRODUCTBESTPRICE = [];
    let PAGINATION = {
        // config 
        "start_page": 1,
        "break_page": -1,
        // ----------------
        "current_page": -1,
        "total_page": -1,
        "next_page": -1,
        "prev_page": -1,
    }
    const removeValOfEl = [".", "ขนาด"]
    async function getBestPrice() {
        getPagination()
        await slowScrollToBottom(1000);
        const elements = await getElementProducts();
        const products = await getProductInfoFromElement(elements);
        // parse price to str ###.##
        PRODUCTS.push(...products);
        console.log(`getBestPrice found ${PRODUCTS.length}`, PAGINATION);
    }
    async function getPagination() {
        const elements = document.querySelectorAll('li.ant-pagination-item');
        const pagination = {
            "current_page": PAGINATION.current_page,
            "total_page": PAGINATION.total_page,
            "next_page": PAGINATION.next_page,
            "prev_page": PAGINATION.prev_page
        }
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element.classList.contains('ant-pagination-item-active')) {
                pagination.current_page = parseInt(element.innerText);
                if (i > 0) {
                    pagination.prev_page = parseInt(elements[i - 1].innerText);
                }
                if (i < elements.length - 1) {
                    pagination.next_page = parseInt(elements[i + 1].innerText);
                }
            }
        }
        // total_page is last element
        pagination.total_page = parseInt(elements[elements.length - 1].innerText);
        PAGINATION = {
            ...PAGINATION,
            ...pagination
        }
    }
    async function goToNextPage() {
        const next_page = PAGINATION.next_page;
        if (next_page == -1) {
            console.log("ไม่มีหน้าถัดไป")
            return;
        }
        const elements = document.querySelectorAll('li.ant-pagination-item');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element.innerText == next_page) {
                element.click();
                break;
            }
        }
        await getBestPrice();
    }
    async function goToPrevPage() {
        const prev_page = PAGINATION.prev_page;
        if (prev_page == -1) {
            console.log("ไม่มีหน้าก่อนหน้า")
            return;
        }
        const elements = document.querySelectorAll('li.ant-pagination-item');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element.innerText == prev_page) {
                element.click();
                break;
            }
        }
        await getBestPrice();
    }
    async function goToPage(page) {
        const elements = document.querySelectorAll('li.ant-pagination-item');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element.innerText == page) {
                element.click();
                break;
            }
        }
        await getBestPrice();
    }
    async function slowScrollToBottom(delayFinish = 5000) {
        const scrollHeight = document.body.scrollHeight * 0.8;
        const clientHeight = document.body.clientHeight;
        const scrollStepBy = 5 // ความเร็วการ scroll
        const scrollStep = scrollHeight / 100 * scrollStepBy;
        let scrollCount = 20;
        const scrollInterval = setInterval(() => {
            window.scrollBy(0, scrollStep);
            scrollCount++;
            if (scrollCount >= 100) {
                clearInterval(scrollInterval);
            }
        }, 15);
        await new Promise(resolve => setTimeout(resolve, delayFinish));
    }
    function stringifyPrice(price) {
        // return "฿" + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    }
    function parsePriceFloatFromStr(price) {
        return parseFloat(price.replace("฿", "").replace(",", ""));
    }
    async function getElementProducts() {
        const productItems = document.querySelectorAll("[data-qa-locator='product-item']");
        let elements = [];
        for (let i = 0; i < productItems.length; i++) {
            const element = productItems[i];
            let title = element.textContent;
            const link = element.querySelector('a').href;
            // find span class ooOxS
            const priceElement = element.querySelector('span.ooOxS').textContent;
            if (!titleOfProductsContain.some(val => {
                title = title.toLowerCase();
                return title.includes(val)
            })) {
                continue;
            }
            const price = parsePriceFloatFromStr(priceElement)
            if (IsNaN(price)) {
                continue;
            }
            elements.push({
                title: title,
                link: link,
                price: price,
            })

        }
        return elements;
    }
    async function getProductInfoFromElement(elements) {
        const products = [];
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const title = element.title;
            let value = -1;
            let unit = -1;
            if (configDebug.UNITALWAYSONE) {
                value = 1;
                unit = 1;
            } else {
                const { _value, _unit } = lookingForUnitInName(title);
                value = _value;
                unit = _unit;
                if(configDebug.lookingForUnitInName)console.log(_value,value, _unit,unit)
            }
            if (unit == -1 || value == -1 || IsNaN(value) || IsNaN(unit)) {
                console.log("ไม่เจอหน่วยหรือค่า", title, element.href)
                PRODUCTSNOTFOUND.push({
                    title: title,
                    link: element.link,
                    price: element.price,
                    avg: element.price,
                })
                continue;
            }
            const product = {
                title: title,
                link: element.link,
                value: value,
                unit: unit,
                price: element.price,
                avg: element.price / value,
            }
            products.push(product);
        }
        return products;
    }
    function lookingForUnitInName(name) {
        const nameArray = name.split(" ");
        let unit = -1;
        let foundUnitIndex = -1;
        let isFound = false;
        let value = -1;
        // หาหน่วย
        if (configDebug.lookingForUnitInName) console.log("elementArray", nameArray)
        for (let i = 0; i < nameArray.length; i++) {
            const element = nameArray[i];
            for (const key in unitOfProduct) {
                // contains
                if (element.includes(key)) {
                    // remove . from element str
                    removeValOfEl.forEach(val => element.replace(val, ""))
                    // if element contain number
                    unit = key;
                    foundUnitIndex = i;
                    // split key from element
                    const elementArray = element.split(key);
                    // if (configDebug.lookingForUnitInName) console.log("elementArray", elementArray)
                    if (ParseIntOrFloat(elementArray[0]) > 0) {
                        value = ParseIntOrFloat(elementArray[0]);
                        isFound = true;
                        break;
                    }
                    if (ParseIntOrFloat(elementArray[1]) > 0) {
                        value = ParseIntOrFloat(elementArray[1]);
                        isFound = true;
                        break;
                    }

                    break;
                }
                for (let i = 0; i < nameArray.length; i++) {
                    for (const key in unitOfProduct) {
                        if (nameArray[i].includes(key)) {
                            foundUnitIndex = i;
                        }
                    }
                    if (foundUnitIndex != -1) {
                        break;
                    }
                }

            }
        }
        if (foundUnitIndex != -1) {
            // ถ้าเจอหน่วยให้หาตัวเลขทางซ้ายหรือขวา แค่ 1 ตำแหน่ง
            if (foundUnitIndex > 0) {
                if (ParseIntOrFloat(nameArray[foundUnitIndex - 1]) > 0) {
                    value = ParseIntOrFloat(nameArray[foundUnitIndex - 1]);
                    isFound = true;

                }
            }
            if (!isFound) {
                if (foundUnitIndex < nameArray.length - 1) {
                    if (ParseIntOrFloat(nameArray[foundUnitIndex + 1]) > 0) {
                        value = ParseIntOrFloat(nameArray[foundUnitIndex + 1]);
                        isFound = true;
                    }
                }
            }
        }
        if (isFound) {
            value = value * unitOfProduct[unit];
            console.log("return-->",value, unit, nameArray)
            return { _value:value, _unit:unit };
        }
        // ex. name is โปรสุดคุ้ม (แพ็คคู่) Nutella Spread 3kg. นูเทลล่า 3 กก. แบบถัง BBE : 01/2024 ( Nutella 3 kg x 2 ถัง )'
        // ให้ค้นหา index ที่อยู่ทางซ้ายหรือขวาของ foundUnitIndex
        if (foundUnitIndex == 0) {
            if (configDebug.lookingForUnitInName) console.log("ถ้าหน่วยอยู่ทางซ้าย ให้ค้นหา index ทางขวา")
            for (let i = foundUnitIndex + 1; i < nameArray.length; i++) {
                const element = nameArray[i];
                if (isNumber(element)) {
                    value = ParseIntOrFloat(element);
                    break;
                }
            }
        } else if (foundUnitIndex == nameArray.length - 1) {
            if (configDebug.lookingForUnitInName) console.log("ถ้าหน่วยอยู่ทางขวา ให้ค้นหา index ทางซ้าย")
            for (let i = foundUnitIndex - 1; i >= 0; i--) {
                const element = nameArray[i];
                if (isNumber(element)) {
                    value = ParseIntOrFloat(element);
                    break;
                }
            }
        } else {
            if (configDebug.lookingForUnitInName) console.log("ถ้าอยู่ตรงกลาง ให้ค้นหาทั้งซ้ายและขวา เจออันไหนก่อนให้ใช้อันนั้น")
            for (let i = 0; i < nameArray.length; i++) {
                const element = nameArray[i];
                if (isNumber(element)) {
                    value = ParseIntOrFloat(element);
                    isFound = true;
                    break;
                }
            }
            if (!isFound) {
                if (configDebug.lookingForUnitInName) console.log("ถ้ายังไม่เจอให้ค้นหาทางซ้าย")
                for (let i = foundUnitIndex - 1; i >= 0; i--) {
                    const element = nameArray[i];
                    if (isNumber(element)) {
                        value = ParseIntOrFloat(element);
                        isFound = true;
                        break;
                    }
                }
            }
        }
        if (configDebug.lookingForUnitInName) console.log("index", foundUnitIndex, nameArray[foundUnitIndex])
        if (foundUnitIndex == -1) {
            if (configDebug.lookingForUnitInName) console.log("return-->","ไม่เจอหน่วย")
            return { _value:value, _unit:unit };
        }
        // ถ้ายังไม่เจอให้ค้นหาใน foundUnitIndex ของง nameArray[foundUnitIndex] นั้นโดยหาทางซ้ายก่อนหรือขวา
        // จะเจอเป็นตัวเลข เช่น 300g
        // ให้เช็คว่าเป็นตัวเลขหรือไม่ ถ้าเป็นให้ใช้ตัวเลขนั้น ให้ value + value ของ index นั้นแล้วค่อย parse เป็น int หรือ float จนกว่าจะ ไม่เจอตัวเลขหรือสิ้นสุด
        if (!isFound) {
            let value = "";
            for (let i = nameArray[foundUnitIndex].length - 1; i >= 0; i--) {
                const element = nameArray[foundUnitIndex][i];
                if (isNumber(element)) {
                    value += element;
                    isFound = true;
                }
            }
            if (isFound) {
                value = ParseIntOrFloat(value);
            }
            if (!isFound) {
                for (let i = 0; i < nameArray[foundUnitIndex].length; i++) {
                    const element = nameArray[foundUnitIndex][i];
                    let value = "";
                    if (isNumber(element)) {
                        value += element;
                        isFound = true;
                    }
                }
            }
        }

        if (!isFound) {
            // pattern string
            if (configDebug.lookingForUnitInName) console.log("ไม่เจอหน่วย ใช้ pattern string")
            for (const key in unitOfProduct) {
                // /\bkey\b/
                let match = name.match(new RegExp(`\\b${key}\\b`, "gi"));
                if (match) {
                    unit = key;
                    // string.slice(match.index + 1).match(/\d+/)[0];
                    let number = name.slice(match.index + 1).match(/\d+/)[0]
                    if (number) {
                        value = ParseIntOrFloat(number);
                        isFound = true;
                    }
                    if (!isFound) {
                        number = name.slice(match.index - 1).match(/\d+/)[0]
                        if (number) {
                            value = ParseIntOrFloat(number);
                            isFound = true;
                        }
                    }
                    break;
                }
            }
        }
        if (isFound) {
            value = ParseIntOrFloat(value);
        }


        if (configDebug.lookingForUnitInName) console.log("return-->",value, unit, nameArray)
        return { _value:value, _unit:unit };
    }
    function isNumber(str) {
        return !isNaN(str);
    }
    function IsNaN(value) {
        return value !== value;
    }
    function ParseIntOrFloat(str) {
        if (isNumber(str)) {
            return parseFloat(str);
        } else {
            return parseInt(str);
        }
    }

    async function saveData(data, filename) {
        if (!data) {
            console.error('Console.save: No data')
            return;
        }
        dir = "/Users/dsumacbookpro1/code/bot/lazada_best_price/data"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        if (!filename) filename = 'data.json'
        // append data to file
        await fs.appendFile(dir + "/" + filename, JSON.stringify(data), function (err) {
            if (err) {
                console.log(err)
            } else {
                console.log('The "data to append" was appended to file!')
            }
        })
    }
    // Go until last page
    await getPagination();
    await goToPage(PAGINATION.start_page);
    while (PAGINATION.current_page < PAGINATION.total_page) {
        await getBestPrice();
        await goToNextPage();
        console.table(PRODUCTS)
        if (PAGINATION.break_page != -1 && PAGINATION.current_page >= PAGINATION.break_page) {
            break;
        }
    }
    // clear console
    // console.clear();
    PRODUCTS.sort((a, b) => a.avg - b.avg);
    console.table(PRODUCTS)
    if (configDebug.beatifulPrice) {
        PRODUCTS.forEach(val => {
            val.price = stringifyPrice(val.price.toFixed(2))
            val.avg = stringifyPrice(val.avg.toFixed(2))
        })
    }
    console.table(PRODUCTS)
    console.table(PRODUCTSNOTFOUND)
    // console.table(PRODUCTBESTPRICE)

})();