var cc = DataStudioApp.createCommunityConnector();



function isAdminUser() {
  return true;
}

function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}
function getConfig(request) {
  var config = cc.getConfig();

  config.newInfo()
    .setId('instructions')
    .setText('Enter the url to fetch csv data');

  config.newTextInput()
    .setId('url')
    .setName('Enter a single url with csv data')
    .setHelpText('url starts with https://api.getconduit.app/workflows/csv/...')
    .setPlaceholder('https://api.getconduit.app/workflows/csv/slug/?timerange=last7days');


  return config.build();
}



function getFields(field_list = ['City', 'Country']) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  console.log('field_list', field_list)
  for (field of field_list) {
    fields.newDimension()
      .setId(field)
      .setType(types.TEXT);
  }


  return fields;
}



function getCSVData(url = "http://example2.csv") {
  var response = UrlFetchApp.fetch(url);
  //console.log(response)
  var text = response.getContentText()

  text = text.replace(/[ \t]+$/gm, '')
  var data = Utilities.parseCsv(text, ',');
  return data;
}

function getHeadersFromUrl(url) {
  var data = getCSVData(url);
  console.log('headers', data[0])
  return data[0];
}

function getSchema(request) {
  var headers = getHeadersFromUrl(request.configParams.url)
  var fields = getFields(headers).build();
  Logger.log(fields);
  return { schema: fields };
}

function getRows(url = "https://api.getconduit.app/workflows/csv/96718b45-6f73-481c-8849-6d2414940d1f/?timerange=last7days", fields = ['CPM', 'Campaign']) {
  console.log('in fields', fields)
  var data = getCSVData(url);

  var headers = {};

  // console.log(data)
  for (let header of fields) {
    if (data[0].indexOf(header) >= 0) headers[header] = data[0].indexOf(header)
  }
  console.log('headers', headers);
  var rows = [];
  for (let i = 0; i < data.length; i++) {
    if (i == 0) continue;
    let row = [];
    for (let header of fields) {
      row.push(data[i][headers[header]])
    }
    rows.push({ values: row })
  }

  return rows;
}


function getData(request) {
  let url = request.configParams.url;
  var requestedFieldIds = request.fields.map(function (field) {
    return field.name;
  });
  console.log('fields', request.fields)
  console.log('ids', requestedFieldIds);
  var requestedFields = getFields(getHeadersFromUrl(url)).forIds(requestedFieldIds);
  console.log('rfl', requestedFields);

  var rows = getRows(url, requestedFieldIds);
  console.log('rows', rows)
  var result = {
    schema: requestedFields.build(),
    rows: rows
  };
  console.log('result', result)
  return result;

}
