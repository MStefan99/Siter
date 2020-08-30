'use strict';

const map = new Map();


map.set('.aac', 'audio/aac');
map.set('.abw', 'application/x-abiword');
map.set('.arc', 'application/x-freearc');
map.set('.avi', 'video/x-msvideo');
map.set('.azw', 'application/vnd.amazon.ebook');
map.set('.bin', 'application/octet-stream');
map.set('.bmp', 'image/bmp');
map.set('.bz', 'application/x-bzip');
map.set('.bz2', 'application/x-bzip2');
map.set('.csh', 'application/x-csh');
map.set('.css', 'text/css');
map.set('.csv', 'text/csv');
map.set('.doc', 'application/msword');
map.set('.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
map.set('.eot', 'application/vnd.ms-fontobject');
map.set('.epub', 'application/epub+zip');
map.set('.gz', 'application/gzip');
map.set('.gif', 'image/gif');
map.set('.htm', 'text/html');
map.set('.html', 'text/html');
map.set('.ico', 'image/vnd.microsoft.icon');
map.set('.ics', 'text/calendar');
map.set('.jar', 'application/java-archive');
map.set('.jpeg', 'image/jpeg');
map.set('.jpg', 'image/jpeg');
map.set('.js', 'text/javascript');
map.set('.json', 'application/json');
map.set('.jsonld', 'application/ld+json');
map.set('.mid', 'audio/midi audio/x-midi');
map.set('.midi', 'audio/midi audio/x-midi');
map.set('.mjs', 'text/javascript');
map.set('.mp3', 'audio/mpeg');
map.set('.mpeg', 'video/mpeg');
map.set('.mpkg', 'application/vnd.apple.installer+xml');
map.set('.odp', 'application/vnd.oasis.opendocument.presentation');
map.set('.ods', 'application/vnd.oasis.opendocument.spreadsheet');
map.set('.odt', 'application/vnd.oasis.opendocument.text');
map.set('.oga', 'audio/ogg');
map.set('.ogv', 'video/ogg');
map.set('.ogx', 'application/ogg');
map.set('.opus', 'audio/opus');
map.set('.otf', 'font/otf');
map.set('.png', 'image/png');
map.set('.pdf', 'application/pdf');
map.set('.php', 'application/x-httpd-php');
map.set('.ppt', 'application/vnd.ms-powerpoint');
map.set('.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
map.set('.rar', 'application/vnd.rar');
map.set('.rtf', 'application/rtf');
map.set('.sh', 'application/x-sh');
map.set('.svg', 'image/svg+xml');
map.set('.swf', 'application/x-shockwave-flash');
map.set('.tar', 'application/x-tar');
map.set('.tif', 'image/tiff');
map.set('.tiff', 'image/tiff');
map.set('.ts', 'video/mp2t');
map.set('.ttf', 'font/ttf');
map.set('.txt', 'text/plain');
map.set('.vsd', 'application/vnd.visio');
map.set('.wav', 'audio/wav');
map.set('.weba', 'audio/webm');
map.set('.webm', 'video/webm');
map.set('.webp', 'image/webp');
map.set('.woff', 'font/woff');
map.set('.woff2', 'font/woff2');
map.set('.xhtml', 'application/xhtml+xml');
map.set('.xls', 'application/vnd.ms-excel');
map.set('.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
map.set('.xml', 'application/xml');
map.set('.xul', 'application/vnd.mozilla.xul+xml');
map.set('.zip', 'application/zip');
map.set('.3gp', 'video/3gpp');
map.set('.3g2', 'video/3gpp2');
map.set('.7z', 'application/x-7z-compressed');


delete map.set;


module.exports = map;