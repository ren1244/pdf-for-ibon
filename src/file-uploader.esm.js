function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".ren1244-ui-file-uploader{\n    width:320px;\n    height:240px;\n    border:1px solid gray;\n    border-radius:5px;\n    display:inline-flex;\n    justify-content:center;\n    align-items:center;\n    background-color:#fff;\n}\n.ren1244-ui-file-uploader>div{\n    text-align:center;\n    display:inline-block;\n}\n.ren1244-ui-file-uploader span{\n    padding:5px 10px;\n    border:1px solid gray;\n    background-color:lightgray;\n    border-radius:5px;\n    color:black;\n    cursor:pointer;\n}\n.ren1244-ui-file-uploader p{\n    color:black;\n}";
styleInject(css_248z);

var templateHtml = "<div class=\"ren1244-ui-file-uploader\">\n    <div>\n        <p>拖曳或選擇檔案</p>\n        <span>選擇</span>\n    </div>\n</div>";

class FileUploader {
    constructor(containerElement) {
        let temp = document.createElement('template');
        temp.innerHTML = templateHtml;
        this.warpEle = temp.content.querySelector('.ren1244-ui-file-uploader');
        containerElement.appendChild(temp.content);

        this.warpEle.addEventListener('dragover', this._stopHandler.bind(this), true);
        this.warpEle.addEventListener('dragleave', this._stopHandler.bind(this), true);
        this.warpEle.addEventListener('drop', this._dropHandler.bind(this), true);
        this.warpEle.addEventListener('click', this._clickHandler.bind(this));

        this.uploderElement = document.createElement('input');
        this.uploderElement.setAttribute('type', 'file');
        this.uploderElement.multiple = true;
        this.uploderElement.addEventListener('change', (evt)=>{
            this._sendFileUploadEvent(evt.target.files);
        });
    }

    _stopHandler(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    _dropHandler(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        console.log(evt.files);
        this._sendFileUploadEvent(evt.dataTransfer.files);
    }

    _clickHandler(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.uploderElement.click();
    }

    _sendFileUploadEvent(files) {
        let cusEvt = new CustomEvent('upload-files',{
            bubbles: true,
            detail:{
                files: files,
                component: this
            }
        });
        this.warpEle.dispatchEvent(cusEvt);
    }
}

export { FileUploader };
