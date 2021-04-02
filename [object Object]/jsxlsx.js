(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('jsxlsx', ['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.jsxlsx = {}));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var jsxlsx = createCommonjsModule(function (module, exports) {

	  const htmlEscapes = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#39;'
	    /** Used to match HTML entities and HTML characters. */

	  };
	  const reUnescapedHtml = /[&<>"']/g;
	  const reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

	  const escapeString = string => string && reHasUnescapedHtml.test(string) ? string.replace(reUnescapedHtml, chr => htmlEscapes[chr]) : string;

	  Object.defineProperty(exports, "__esModule", {
	    value: !0
	  });
	  /*
	  * FileSaver.js
	  * A saveAs() FileSaver implementation.
	  *
	  * By Eli Grey, http://eligrey.com
	  *
	  * License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
	  * source  : http://purl.eligrey.com/github/FileSaver.js
	  */
	  // The one and only way of getting global scope in all environments
	  // https://stackoverflow.com/q/3277182/1008999

	  var _global = typeof window === 'object' && window.window === window ? window : (typeof self === 'object' && self.self) === self ? self : (typeof commonjsGlobal === 'object' && commonjsGlobal.global) === commonjsGlobal ? commonjsGlobal : commonjsGlobal;

	  function bom(blob, opts) {
	    if (typeof opts === 'undefined') opts = {
	      autoBom: false
	    };else if (typeof opts !== 'object') {
	      console.warn('Deprecated: Expected third argument to be a object');
	      opts = {
	        autoBom: !opts
	      };
	    } // prepend BOM for UTF-8 XML and text/* types (including HTML)

	    if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
	      return new Blob([String.fromCharCode(0xFEFF), blob], {
	        type: blob.type
	      });
	    }

	    return blob;
	  }

	  function download(url, name, opts) {
	    var xhr = new XMLHttpRequest();
	    xhr.open('GET', url);
	    xhr.responseType = 'blob';

	    xhr.onload = () => saveAs(xhr.response, name, opts);

	    xhr.onerror = () => console.error('could not download file');

	    xhr.send();
	  }

	  function corsEnabled(url) {
	    var xhr = new XMLHttpRequest(); // use sync to avoid popup blocker

	    xhr.open('HEAD', url, false);

	    try {
	      xhr.send();
	    } catch (e) {}

	    return xhr.status >= 200 && xhr.status <= 299;
	  }

	  function click(node) {
	    try {
	      node.dispatchEvent(new MouseEvent('click'));
	    } catch (e) {
	      var evt = document.createEvent('MouseEvents');
	      evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
	      node.dispatchEvent(evt);
	    }
	  }

	  var saveAs = _global.saveAs || ( // probably in some web worker
	  typeof window !== 'object' || window !== _global ? function saveAs() {}
	  /* noop */
	  // Use download attribute first if possible (#193 Lumia mobile)
	  : 'download' in HTMLAnchorElement.prototype ? function saveAs(blob, name, opts) {
	    var URL = _global.URL || _global.webkitURL;
	    var a = document.createElement('a');
	    name = name || blob.name || 'download';
	    a.download = name;
	    a.rel = 'noopener'; // tabnabbing
	    // TODO: detect chrome extensions & packaged apps
	    // a.target = '_blank'

	    if (typeof blob === 'string') {
	      // Support regular links
	      a.href = blob;

	      if (a.origin !== location.origin) {
	        corsEnabled(a.href) ? download(blob, name, opts) : click(a, a.target = '_blank');
	      } else {
	        click(a);
	      }
	    } else {
	      // Support blobs
	      a.href = URL.createObjectURL(blob);
	      setTimeout(function () {
	        URL.revokeObjectURL(a.href);
	      }, 4E4); // 40s

	      setTimeout(function () {
	        click(a);
	      }, 0);
	    }
	  } // Use msSaveOrOpenBlob as a second approach
	  : 'msSaveOrOpenBlob' in navigator ? function saveAs(blob, name, opts) {
	    name = name || blob.name || 'download';

	    if (typeof blob === 'string') {
	      if (corsEnabled(blob)) {
	        download(blob, name, opts);
	      } else {
	        var a = document.createElement('a');
	        a.href = blob;
	        a.target = '_blank';
	        setTimeout(function () {
	          click(a);
	        });
	      }
	    } else {
	      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
	    }
	  } // Fallback to using FileReader and a popup
	  : function saveAs(blob, name, opts, popup) {
	    // Open a popup immediately do go around popup blocker
	    // Mostly only available on user interaction and the fileReader is async so...
	    popup = popup || open('', '_blank');

	    if (popup) {
	      popup.document.title = popup.document.body.innerText = 'downloading...';
	    }

	    if (typeof blob === 'string') return download(blob, name, opts);
	    var force = blob.type === 'application/octet-stream';

	    var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari;

	    var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);

	    if ((isChromeIOS || force && isSafari) && typeof FileReader !== 'undefined') {
	      // Safari doesn't allow downloading of blob URLs
	      var reader = new FileReader();

	      reader.onloadend = function () {
	        var url = reader.result;
	        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;');
	        if (popup) popup.location.href = url;else location = url;
	        popup = null; // reverse-tabnabbing #460
	      };

	      reader.readAsDataURL(blob);
	    } else {
	      var URL = _global.URL || _global.webkitURL;
	      var url = URL.createObjectURL(blob);
	      if (popup) popup.location = url;else location.href = url;
	      popup = null; // reverse-tabnabbing #460

	      setTimeout(function () {
	        URL.revokeObjectURL(url);
	      }, 4E4); // 40s
	    }
	  });
	  _global.saveAs = saveAs.saveAs = saveAs;

	  const validator = (exportCfg, fName = exportCfg.filename || null) => {
	    const childValidator = array => array.every(index => Array.isArray(index));

	    let errorOp = '';
	    if (fName == null || typeof fName !== 'string') errorOp = "Required property 'filename' is missing or not a string!";
	    if (!Array.isArray(exportCfg.sheet.data)) errorOp = "Sheet data is missing or not a valid Array!";
	    if (!childValidator(exportCfg.sheet.data)) errorOp = "Sheet data property 'childs' is missing or not a valid Array!";
	    return errorOp === '' || !!console.log(errorOp);
	  },
	        getColLetter = colIndex => {
	    if (isNaN(colIndex)) return '';
	    const prefix = ~~(colIndex / 26);
	    const letter = String.fromCharCode(97 + colIndex % 26).toUpperCase();
	    return 0 === prefix ? letter : getColLetter(prefix - 1) + letter;
	  },
	        getCellNumber = (index, rowNumber) => '' + getColLetter(index) + rowNumber,
	        strCellFormat = (index, value, rowIndex) => `<c r="${getCellNumber(index, rowIndex)}" t="inlineStr"><is><t>${escapeString(value)}</t></is></c>`,
	        numCellFormat = (index, value, rowIndex) => `<c r="${getCellNumber(index, rowIndex)}"><v>${value}</v></c>`,
	        formatCell = (cell, index, rowIndex) => "string" === cell.type ? strCellFormat(index, cell.value, rowIndex) : numCellFormat(index, cell.value, rowIndex),
	        formatRow = (row, index, rowIndex = index + 1) => `<row r="${rowIndex}">${row.map((cell, cellIndex) => formatCell(cell, cellIndex, rowIndex)).join('')}</row>`,
	        generateRows = rowObj => rowObj.map((row, i) => formatRow(row, i)).join("");

	  workbookXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"><workbookPr/><sheets><sheet state="visible" name="Sheet1" sheetId="1" r:id="rId3"/></sheets><definedNames/><calcPr/></workbook>', workbookXMLRels = '<?xml version="1.0" ?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n<Relationship Id="rId3" Target="worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/>\n</Relationships>', rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>', contentTypes = '<?xml version="1.0" ?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n<Default ContentType="application/xml" Extension="xml"/>\n<Default ContentType="application/vnd.openxmlformats-package.relationships+xml" Extension="rels"/>\n<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" PartName="/xl/worksheets/sheet1.xml"/>\n<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" PartName="/xl/workbook.xml"/>\n</Types>', templateSheet = '<?xml version="1.0" ?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:mx="http://schemas.microsoft.com/office/mac/excel/2008/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"><sheetData>{placeholder}</sheetData></worksheet>';

	  const generateXMLWorksheet = e => {
	    const t = generateRows(e);
	    return templateSheet.replace("{placeholder}", t);
	  };

	  var JSXLSX = e => {
	    if (!validator(e)) throw new Error("Validation failed.");
	    const r = generateXMLWorksheet(e.sheet.data);
	    return o.file("worksheets/sheet1.xml", r), t.generateAsync({
	      type: "blob",
	      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	    }).then(t => {
	      FileSaver.saveAs(t, `${e.filename}.xlsx`);
	    });
	  };

	  exports.generateXMLWorksheet = generateXMLWorksheet, exports.default = JSXLSX;
	});
	var jsxlsx$1 = unwrapExports(jsxlsx);
	var jsxlsx_1 = jsxlsx.generateXMLWorksheet;

	exports.default = jsxlsx$1;
	exports.generateXMLWorksheet = jsxlsx_1;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=jsxlsx.js.map
