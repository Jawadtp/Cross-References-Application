export default function dataBridge(apiUrl, lookupField) {

    let calloutURL = apiUrl.replace('{id}', lookupField);
    console.log('callout url == ' + calloutURL);

    return fetch(calloutURL, {
        method: 'GET',
        mode: 'cors'
    }).then((response) => response.json())
        .then((repos) => {
            let data = repos;

            return data;
        });
}