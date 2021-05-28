export default function testExistence(pathToTest, fallbackPath=false, rejectFailures=false) {
    return new Promise((resolve, reject) => {
        // create an XHR object
        const xhr = new XMLHttpRequest();

        // listen for `onload` event
        xhr.onload = () => {
            if (xhr.status == 200) {
                resolve(pathToTest);
            } else {
                if(rejectFailures === true)
                    reject(fallbackPath)
                else
                    resolve(fallbackPath);
            }
        };

        // create a `HEAD` request
        xhr.open('HEAD', pathToTest);

        // send request
        xhr.send();
    });
}