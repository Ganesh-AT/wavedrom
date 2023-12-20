'use strict';

const renderAny = require('./render-any.js');
const createElement = require('./create-element.js');

function renderWaveElement (index, source, outputElement, waveSkin, ImageAndXMLSerializer) {

    // cleanup
    while (outputElement.childNodes.length) {
        outputElement.removeChild(outputElement.childNodes[0]);
    }

    const actSVG = createElement(renderAny(index, source, waveSkin));

    if (source.config.wrapSvgInImg) {
        const svgAsImgString = encodeURIComponent(ImageAndXMLSerializer.ser.serializeToString(actSVG));
        ImageAndXMLSerializer.imgt.src = `data:image/svg+xml;utf8,${svgAsImgString}` ;
        if (source.config.fit2pane) {
            ImageAndXMLSerializer.imgt.style = 'width:100%;height:100%;';
        }
        outputElement.insertBefore(ImageAndXMLSerializer.imgt, null);
    } else {
        outputElement.insertBefore(actSVG, null);
    }

}

module.exports = renderWaveElement;
