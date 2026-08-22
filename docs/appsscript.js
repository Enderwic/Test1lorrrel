/**
 * Google Apps Script — бэкенд статистики «Змейки».
 *
 * Как подключить:
 * 1. Откройте вашу Google-таблицу → Расширения → Apps Script.
 * 2. Полностью замените код на этот и сохраните.
 * 3. Разверните → Новое развёртывание → Веб-приложение:
 *    «Выполнять как: я», «У кого есть доступ: все».
 * 4. Скопируйте URL /exec — он уже прописан в src/game/core.ts (STATS_WEBHOOK_URL).
 *
 * Что умеет:
 *  - doPost: принимает ЛЮБОЙ JSON, колонки создаются автоматически по строке
 *    заголовков — новые поля никогда не ломают старые строки.
 *  - doGet?action=refcount&id=<telegram_id>&cb=<callback>: JSONP-ответ
 *    { id, count } — сколько пользователей активировало реферала с этим id
 *    (строки event = "referral_activated" и ref = id). JSONP, потому что
 *    Apps Script не отдаёт CORS-заголовки.
 */

var SHEET_NAME = 'SnakeStats';

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['event', 'telegram_id', 'first_name', 'mode', 'theme', 'score', 'session_sec']);
  }
  return sh;
}

function doPost(e) {
  try {
    var body = (e && e.postData && e.postData.contents) || '{}';
    var row = JSON.parse(body);
    var sh = getSheet_();

    var lastCol = sh.getLastColumn();
    var headers = lastCol > 0
      ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
      : [];

    // недостающие колонки добавляем в конец — старые данные не страдают
    var keys = Object.keys(row);
    var missing = [];
    for (var i = 0; i < keys.length; i++) {
      if (headers.indexOf(keys[i]) === -1) missing.push(keys[i]);
    }
    if (missing.length > 0) {
      sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
      headers = headers.concat(missing);
    }

    var values = [];
    for (var j = 0; j < headers.length; j++) {
      var v = row[headers[j]];
      values.push(v === undefined || v === null ? '' : v);
    }
    sh.appendRow(values);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var params = (e && e.parameter) || {};

  if (params.action === 'refcount') {
    var id = String(params.id || '');
    var cb = String(params.cb || 'callback').replace(/[^a-zA-Z0-9_$.]/g, '');
    var count = 0;

    try {
      var sh = getSheet_();
      var lastRow = sh.getLastRow();
      var lastCol = sh.getLastColumn();
      if (lastRow > 1 && lastCol > 0) {
        var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
        var evIdx = headers.indexOf('event');
        var refIdx = headers.indexOf('ref');
        if (evIdx >= 0 && refIdx >= 0) {
          var data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
          for (var i = 0; i < data.length; i++) {
            if (String(data[i][evIdx]) === 'referral_activated' && String(data[i][refIdx]) === id) {
              count++;
            }
          }
        }
      }
    } catch (err) {
      count = 0;
    }

    var payload = JSON.stringify({ id: id, count: count });
    return ContentService.createTextOutput(cb + '(' + payload + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_({ ok: true, service: 'snake-stats' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
