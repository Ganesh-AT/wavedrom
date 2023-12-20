'use strict';

const renderWaveElement = require('./render-wave-element.js');

function renderWaveForm (index, source, output) {

    let ImageAndXMLSerializer = {
        imgt: document.createElement('img'),
        ser: new XMLSerializer()
    };
    ImageAndXMLSerializer.imgt.id = 'WaveDrom_SVGinIMG_' + index ;

    renderWaveElement(index, source, document.getElementById(output + index),
        window.WaveSkin, ImageAndXMLSerializer);

}

module.exports = renderWaveForm;

/* eslint-env browser */
