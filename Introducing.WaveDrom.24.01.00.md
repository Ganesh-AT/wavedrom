# Introducing WaveDrom 24.01

## Background and Motivation

WaveDrom is a timing diagram (waveform) generator widely used in engineering circles.
It converts textual description specified as a JSON object ('WaveJSON' in WaveDrom parlance) into a vector graphics file (in the SVG format).
The use of vector graphics ensures that the diagrams are of high quality and resistant to scaling artifacts.
The software uses a library of 'bricks' ('skin' in WaveDrom parlance) to assemble waveforms.
The usage of standard building blocks ensures a consistent look for the rendering of different signal lanes.
Waveforms created by different users also tend to have a consistent look as long as the same skin is being used.
By virtue of being written in JavaScript, the software is inherently cross-platform and can be run locally using any modern web browser.

The clean and consistent look of the WaveDrom output makes it a candidate for generating professional electrical diagrams.
These are meant for inclusion in customer-facing documents such as datasheets and programming reference manuals.
Back in 2019, the folks at Ambarella attempted to use WaveDrom for this purpose.
However, some shortcomings of the software complicated the creation of some complex waveforms.
These included the [ability to combine two different waveforms in the same signal lane](https://github.com/wavedrom/wavedrom/issues/121) (to create, for example, a DDR clock waveform), [over-estimation of label widths](https://github.com/wavedrom/wavedrom/issues/265) leading to disfigured waveforms, and [inability to composite two different SVGs](https://github.com/wavedrom/wavedrom/issues/263) for post-processing, among others.
As a result, the output SVG had to be manually edited to deliver a production-worthy waveform.
This was not turning out to be a scalable solution with the growth in the number of SVGs and fine-tuning of previously-finalized ones based on feedback.

Thanks to the open-source nature of the software, a custom fork was made possible.
Features were slowly added and refined based on user requirements over the last four years.
A survey of WaveJSON extensions supported by other software such as [SchemDraw](https://github.com/cdelker/schemdraw) and pending WaveDrom pull requests was also made.
These were also incorporated with appropriate modifications into the custom fork.
In the course of verification, a large number of bug fixes addressing existing open issues was also made.

WaveDrom 24.01.00 incorporates all the updates made over the last four years in Ambarella's custom fork.
It aims to extend WaveDrom's feature set to address technical documentation requirements from a marketing perspective while firming up its credentials as the de-facto solution for engineers.
As part of this overhaul, updates have been made to the core WaveDrom engine as well as the web-based editor. The scope of this document is restricted to the core WaveDrom engine.

## WaveJSON Grammar

The [schema repository](https://github.com/wavedrom/schema/blob/master/waveschema.json) currently maintained on Github under WaveDrom serves as a comprehensive JSON representation of the WaveJSON schema.
The EBNF (Extended Backus-Naur Form) representation of the grammar provides a more concise and terse overview. 
This makes it suitable for comparing extensive updates like the ones made in the move from WaveDrom 3.3.0 to WaveDrom 24.01.00.
The EBNF representation of the WaveJSON scheme as supported by WaveDrom 3.3.0 is available [here](https://github.com/Ganesh-AT/wavedrom/blob/master/WaveJSON-Grammar.txt).
The corresponding representation for the schema supported by WaveDrom 24.01.00 is maintained [here](https://github.com/Ganesh-AT/wavedrom/blob/wavedrom-24.01/WaveJSON-Grammar.txt).
The new grammar is completely backwards-compatible, meaning that valid WaveJSON inputs for WaveDrom 3.3.0 will continue to work with WaveDrom 24.01.00. The rendered output also remains the same, except for bug fixes.

A quick overview of the new features is obtained via Github's [diff view of the two grammar representations](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4).
The remainder of this document analyzes each update in detail, along with links to examples
However, a look at the new skins included in WaveDrom 24.01.00 is in order first.

## Feature Set Updates

### New Skins

The WaveDrom skins dictate the appearance of various bricks along with the styles of the markers used in the arcs (edge specifications).
Subjectively speaking, the marker style in the _default_ skin is slightly over-sized and has too much of an offset from the arc's end points for professional documents. 
After a few trials, new marker styles were finalized and incorporated into a new _professional_ skin.
This formed the basis for the two additional skins described below.

Some timing diagrams require the annotation of different threshold levels.
The rise and fall times of the signals in the _default_ skin are too short to bring those out in an uncluttered manner.
A new *professional_srf* skin was prepared with signal transitions over 11 horizontal units (compared to the 6 in the _default_ skin).

The representation of the transition to high-impedance states in the _default_ skin is electrically accurate, but technical document requirements dictate a professional look with sharp transitions. The bundled *professional_sharpz* skin addresses this aspect.

[Using the Professional Skins - WaveJSON](demo/professional-skins.json)

[ObservableHQ Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-professional-skins-fit2pane)

![](demo/professional-skins.svg)

### Fractional _hscale_ Support

WaveDrom 3.3.0 supports only positive integer values for the _hscale_ attribute in the _config_ object.
The [updated grammar](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R48) for WaveDrom 24.01.0 adds support for fractional values less than 1.

This feature is meant to horizontally compress timing diagrams rendering a large number of cycles.
One of the oft-suggested remedies for such diagrams is the use of the _narrow_ skin. 
_narrower_ and _narrowerer_ skins have also been created for diagrams involving 100+ cycles. 
While the _narrow_ skin is a true skin with different transition slopes compared to the _default_ one, the others are simply scaled versions of the _narrow_ skin with scaling values set to 0.5 and 0.25.
The incorporation of support for fractional _hscale_ less than 1 avoids the need for skins that are simply scaled versions of existing ones.
It also provides users with flexibility to adjust the horizontal width - an aspect that is not possible with pre-generated skins.

It must be noted that the fractional _hscale_ is not a straightforward scaling operation on the whole diagram.
Only the rendered bricks and edge / node coordinates are scaled. 
Squished labels and arrows are avoided by retaining the text and marker sizes based on the diagram's skin and other configuration parameters.

[Exploring Fractional _hscale_ - WaveJSON](demo/fractional-hscale.json)

[ObservableHQ Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-0-fractional-hscale)

![](demo/fractional-hscale.svg)

It is possible to apply this feature to any diagram - even ones with just a couple of cycles.
This can create funny-looking waveforms with cut-off header text and the like.
However, that is not the intended use-case for this feature. Rather, real-world timing diagrams like the one above are the intended target.

### Auto-Scaled Waveforms with _fit2pane_

The 20x20 bricks used by WaveDrom are too small when viewed at their native resolution in large-sized monitors with high-resolution displays.
In such setups, waveforms dealing with a small number of cycles are often too tiny to make out the real-time feedback in the web-based editor.
On the other hand, large waveforms in small-sized browser windows may result in the user having to resort to horizontal scrolling to view the effects of their edits.
In such cases, users often lose sight of the signal names on the left in the process of checking updates at the right edge.

Fortunately, the use of vector graphics allows the resultant diagram to be fittend inside the available viewport without loss of detail.
A [new configuration bit (_fit2pane_)](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R52) can be used to enable this feature.
It is disabled by default to retain backwards compatibility.

[Enabling the _fit2pane_ Feature - WaveJSON](demo/fit2pane-true.json)

[Disabling the _fit2pane_ Feature - WaveJSON](demo/fit2pane-false.json)

[ObservableHQ Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-0-fit2pane-true-v-false)

![](demo/fit2pane.png)

Enabling this feature doesn't alter the core contents of the rendered SVG.
By default, the width and height of the picture are set to the rendered image's absolute width and height.
If _fit2pane_ is set, the width and height to 100% of the picture's container element.



## Bug Fixes and Issue Resolutions























