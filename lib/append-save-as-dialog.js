'use strict';

function appendSaveAsDialog (index, output, obj = undefined) {
    let menu;

    function closeMenu(e) {
        const left = parseInt(menu.style.left, 10);
        const top = parseInt(menu.style.top, 10);
        if (
            e.x < left ||
            e.x > (left + menu.offsetWidth) ||
            e.y < top ||
            e.y > (top + menu.offsetHeight)
        ) {
            menu.parentNode.removeChild(menu);
            document.body.removeEventListener('mousedown', closeMenu, false);
        }
    }

    const div = document.getElementById(output + index);

    div.childNodes[0].addEventListener('contextmenu',
        function (e) {
            menu = document.createElement('div');

            menu.className = 'wavedromMenu';
            menu.style.top = e.y + 'px';
            menu.style.left = e.x + 'px';

            const list = document.createElement('ul');
            const savePng = document.createElement('li');
            savePng.innerHTML = 'Save as PNG';
            list.appendChild(savePng);

            const saveSvg = document.createElement('li');
            saveSvg.innerHTML = 'Save as SVG';
            list.appendChild(saveSvg);

            //const saveJson = document.createElement('li');
            //saveJson.innerHTML = 'Save as JSON';
            //list.appendChild(saveJson);

            menu.appendChild(list);

            document.body.appendChild(menu);

            const collectUsefulDefs = (node, usefulDefs) => {
                for (const child of node.children) {
                    if (child.attributes['xlink:href'] != null) {
                        const currDef = child.attributes['xlink:href'].value.replace('#', '') ;
                        usefulDefs[currDef] = 1 ;
                    } else {
                        collectUsefulDefs(child, usefulDefs);
                    }
                }
            };
        
            function ssvg (idx) {
                let svg, ser, embedWaveJS, svgString;
        
                let svgInImg = document.getElementById('WaveDrom_SVGinIMG_' + idx);
                if (svgInImg === null) { // All SVGs are embedded directly in the page
                    svg = document.getElementsByTagName('svg')[idx];
                } else {
                    const svgParser = new DOMParser();
                    const rawSvgStr = decodeURIComponent(svgInImg.src).replace('data:image/svg+xml;utf8,', '');
                    const svgInDoc = svgParser.parseFromString(rawSvgStr, 'image/svg+xml');
                    svg = svgInDoc.getElementsByTagName('svg')[0];
                }
                embedWaveJS = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
                embedWaveJS.setAttribute('id', 'WaveJS');
                embedWaveJS.textContent = '\n<!--// WaveJS rendered using WaveDrom version ' + window.WaveDrom.version + '\n' 
                    + obj + '\n-->\n';
                svg.appendChild(embedWaveJS);

                const usefulDefs = {};
                collectUsefulDefs(svg.getElementById('waves_' + idx), usefulDefs);
                const defNode = (svg.getElementsByTagName('defs'))[0] ;
                const defs2Remove = [];
                for (const child of defNode.children) {
                    // Remove defs entry only if it is a 'g' element, and is not referenced
                    // Avoid markers, as they are referenced by style classes
                    if ((usefulDefs[child.id] === undefined) && (child.nodeName === 'g')) {
                        defs2Remove.push(child);
                    }
                }
                for (const child of defs2Remove) {
                    defNode.removeChild(child);
                }            
                
                ser = new XMLSerializer();
                svgString = ser.serializeToString(svg);
                svg.removeChild(embedWaveJS);
                let components = svgString.split(/(<metadata[^>]*>)/);
                components[2] = components[2].replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
                let tagOnString = components[0] + '\n' + components[1] + components[2] ;
                return '<?xml version="1.0" standalone="no"?>\n'
                    + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
                    + '<!-- Created with WaveDrom -->\n' + tagOnString ;
            }

            savePng.addEventListener('click',
                function () {
                    let pngscalef = 20; // default from editor application

                    const img = new Image();
                    const canvas = document.createElement('canvas');

                    function lonload() {
                        canvas.width = ((pngscalef + 1) >> 1) * img.width;
                        canvas.height = ((pngscalef + 1) >> 1) * img.height;
                        const context = canvas.getContext('2d');
                        context.drawImage(img, 0, 0);

                        const pngdata = canvas.toDataURL('image/png');

                        const a = document.createElement('a');
                        a.href = pngdata;
                        a.download = 'wavedrom.png';
                        var theEvent = document.createEvent('MouseEvent');
                        theEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                        a.dispatchEvent(theEvent);
                        // a.click();
                    }

                    let svgBody = ssvg(index);
                    const svgdata = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgBody)));
                    img.src = svgdata;
                    // let html = (encodeURIComponent(ssvg(index))) ;
                    // const svgdata = 'data:image/svg+xml;base64,' + btoa(html) ;
                    // img.src = svgdata;

                    if (img.complete) {
                        lonload();
                    } else {
                        img.onload = lonload ;
                    }

                    menu.parentNode.removeChild(menu);
                    document.body.removeEventListener('mousedown', closeMenu, false);
                },
                false
            );

            saveSvg.addEventListener('click',
                function () {
                    const svg2dl = ssvg(index);
                    const a = document.createElement('a');
                    a.href = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg2dl)));
                    a.download = 'wavedrom.svg';
                    a.click();
                    menu.parentNode.removeChild(menu);
                    document.body.removeEventListener('mousedown', closeMenu, false);
                },
                false
            );

            menu.addEventListener('contextmenu',
                function (ee) {
                    ee.preventDefault();
                },
                false
            );

            document.body.addEventListener('mousedown', closeMenu, false);

            e.preventDefault();
        },
        false
    );
}

module.exports = appendSaveAsDialog;

/* eslint-env browser */
/* eslint no-console: 0 */
