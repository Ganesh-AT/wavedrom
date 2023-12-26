-   Introducing WaveDrom 24.01
    -   Background and Motivation
    -   WaveJSON Grammar
    -   Feature Set Updates
        -   New Skins
        -   New Configuration Attributes
        -   New Signal Attributes
        -   New Wave Specifications
        -   Revisiting the *edge* Architecture
        -   Miscellaneus Features
        -   Grouping of Text Elements for a Better *tspan* Experience
    -   Bug Fixes and Issue Resolutions
        -   Fixing up Subcycles Support
        -   Handling Phase Artifacts
        -   SVG 1.1 Validation Checks
        -   Cleaning up the *tick* & *tock* Implementation
        -   Text Labels on Single-Bit Bricks
        -   Multi-Line Data Labels
    -   Enabling a Plugin Architecture
        -   Custom Wave Specifications - Trigonometric Functions
        -   Custom Wave Specifications - Asynchronous Signals
        -   Custom Wave Specifications - Bipolar Signals
    -   Project Roadmap
        -   Known Issues
        -   Pull-Request Submission Invites

# Introducing WaveDrom 24.01

## Background and Motivation

WaveDrom is a timing diagram (waveform) generator widely used in
engineering circles. It converts textual description specified as a JSON
object (\'WaveJSON\' in WaveDrom parlance) into a vector graphics file
(in the SVG format). The use of vector graphics ensures that the
diagrams are of high quality and resistant to scaling artifacts. The
software uses a library of \'bricks\' (\'skin\' in WaveDrom parlance) to
assemble waveforms. The usage of standard building blocks ensures a
consistent look for the rendering of different signal lanes. Waveforms
created by different users also tend to have a consistent look as long
as the same skin is being used. By virtue of being written in
JavaScript, the software is inherently cross-platform and can be run
locally using any modern web browser.

The clean and consistent look of the WaveDrom output makes it a
candidate for generating professional electrical diagrams. These are
meant for inclusion in customer-facing documents such as datasheets and
programming reference manuals. Back in 2019, the folks at Ambarella
attempted to use WaveDrom for this purpose. However, some shortcomings
of the software complicated the creation of some of the complex
waveforms. These included the [inability to combine two different
waveforms in the same signal
lane](https://github.com/wavedrom/wavedrom/issues/121) (to create, for
example, a DDR clock waveform), [over-estimation of label
widths](https://github.com/wavedrom/wavedrom/issues/265) leading to
disfigured waveforms, and [inability to composite two different
SVGs](https://github.com/wavedrom/wavedrom/issues/263) for
post-processing, among others. As a result, many of the output SVGs had
to be manually edited to deliver a production-worthy waveform. This was
not turning out to be a scalable solution with the growth in the number
of SVGs and the need to fine-tune previously-finalized ones based on
feedback.

Thanks to the open-source nature of the software, a custom fork was made
possible. Features were slowly added and refined based on user
requirements over the last four years. A survey of WaveJSON extensions
supported by other software such as
[SchemDraw](https://github.com/cdelker/schemdraw) and pending WaveDrom
pull requests was also made. These were also incorporated with
appropriate modifications into the custom fork. In the course of
verification, a large number of bug fixes addressing existing open
issues was also made.

WaveDrom 24.01 incorporates all the updates made over the last four
years in Ambarella\'s custom fork. It aims to extend WaveDrom\'s feature
set to address technical documentation requirements from a marketing
perspective while firming up its credentials as the de-facto solution
for engineers. As part of this overhaul, updates have been made to the
core WaveDrom engine as well as the web-based editor. The scope of this
document is restricted to the core WaveDrom engine.

## WaveJSON Grammar

The [schema
repository](https://github.com/wavedrom/schema/blob/master/waveschema.json)
currently maintained on Github under WaveDrom serves as a comprehensive
JSON representation of the WaveJSON schema. The EBNF (Extended
Backus-Naur Form) representation of the grammar provides a more concise
and terse overview. This makes it suitable for comparing extensive
updates like the ones made in the move from WaveDrom 3.3.0 to WaveDrom
24.01. The EBNF representation of the WaveJSON scheme as supported by
WaveDrom 3.3.0 is available
[here](https://github.com/Ganesh-AT/wavedrom/blob/master/WaveJSON-Grammar.txt).
The corresponding representation for the schema supported by WaveDrom
24.01 is maintained
[here](https://github.com/Ganesh-AT/wavedrom/blob/wavedrom-24.01/WaveJSON-Grammar.txt).
The new grammar is completely backwards-compatible, meaning that valid
WaveJSON inputs for WaveDrom 3.3.0 will continue to work with WaveDrom
24.01. The rendered output also remains the same, except for bug fixes.

A quick overview of the new features is obtained via Github\'s [diff
view of the two grammar
representations](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4).
The remainder of this document analyzes each update in detail, along
with links to examples However, a look at the new skins included in
WaveDrom 24.01 is in order first.

## Feature Set Updates

### New Skins

The WaveDrom skins dictate the appearance of various bricks along with
the styles of the markers used in the arcs (edge specifications).
Subjectively speaking, the marker style in the *default* skin is
slightly over-sized and has too much of an offset from the arc\'s end
points for professional documents. After a few trials, new marker styles
were finalized and incorporated into a new *professional* skin. This
formed the basis for the two additional skins described below.

Some timing diagrams require the annotation of different threshold
levels. The rise and fall times of the signals in the *default* skin are
too short to bring those out in an uncluttered manner. A new
\*professional*srf\* skin was prepared with signal transitions over 11
horizontal units (compared to the 6 in the *default\_ skin).

The representation of the transition to high-impedance states in the
*default* skin is electrically accurate, but technical document
requirements dictate a professional look with sharp transitions. The
bundled \*professional_sharpz\* skin addresses this aspect.

[Using the Professional Skins - WaveJSON](demo/professional-skins.json)

[ObservableHQ
Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-professional-skins-fit2pane)
\[ Manually process the first cell with the FileAttachment list if the
rendering doesn\'t match the SVG output below \].

![](demo/professional-skins.svg)

### New Configuration Attributes

#### Fractional *hscale* Support

WaveDrom 3.3.0 supports only positive integer values for the *hscale*
attribute in the *config* object. The [updated
grammar](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R50)
for WaveDrom 24.01 adds support for fractional values less than 1.

This feature is meant to horizontally compress timing diagrams rendering
a large number of cycles. One of the oft-suggested remedies for such
diagrams is the use of the *narrow* skin. *narrower* and *narrowerer*
skins have also been created for diagrams involving 100+ cycles. While
the *narrow* skin is a true skin with different transition slopes
compared to the *default* one, the others are simply scaled versions of
the *narrow* skin with scaling values set to 0.5 and 0.25. The
incorporation of support for fractional *hscale* less than 1 avoids the
need for skins that are simply scaled versions of existing ones. It also
provides users with flexibility to adjust the horizontal width - an
aspect that is not possible with pre-generated skins.

It must be noted that the fractional *hscale* is not a straightforward
scaling operation on the whole diagram. Only the rendered bricks and
edge / node coordinates are scaled. Squished labels and arrows are
avoided by retaining the text and marker sizes based on the diagram\'s
skin and other configuration parameters.

[Exploring Fractional *hscale* - WaveJSON](demo/fractional-hscale.json)

[ObservableHQ
Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-0-fractional-hscale)

![](demo/fractional-hscale.svg)

It is possible to apply this feature to any diagram - even ones with
just a couple of cycles. This can create funny-looking waveforms with
cut-off header text and the like. However, that is not the intended
use-case for this feature. Rather, real-world timing diagrams like the
one above are the intended target.

#### Auto-Scaled Waveforms with *fit2pane*

The 20x20 bricks used by WaveDrom are too small when viewed at their
native resolution in large-sized monitors with high-resolution displays.
In such setups, waveforms dealing with a small number of cycles are
often too tiny to make out the real-time feedback in the web-based
editor. On the other hand, large waveforms in small-sized browser
windows may result in the user having to resort to horizontal scrolling
to view the effects of their edits. In such cases, users often lose
sight of the signal names on the left in the process of checking updates
at the right edge.

Fortunately, the use of vector graphics allows the resultant diagram to
be fitted inside the available viewport without loss of detail. A [new
configuration bit
(*fit2pane*)](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R54)
can be used to enable this feature. It is disabled by default to retain
backwards compatibility.

[Enabling the *fit2pane* Feature - WaveJSON](demo/fit2pane-true.json)

[Disabling the *fit2pane* Feature - WaveJSON](demo/fit2pane-false.json)

[ObservableHQ
Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-0-fit2pane-true-v-false)

![](demo/fit2pane.png)

Enabling this feature doesn\'t alter the core contents of the rendered
SVG. By default, the width and height of the picture are set to the
rendered image\'s absolute width and height. If *fit2pane* is set, the
width and height are configured to 100% of the picture\'s container
element.

#### Avoiding *style* and *defs* Leakage with *wrapSvgInImg*

The CSS and SVG specifications share a lot in common. CSS styles
specified anywhere in the document (even outside the SVG container, or
inside another one) are available for use within a SVG, and vice-versa.
This applies to SVG *defs* elements too. *defs* specified for a SVG can
end up causing issues in another SVG on the same page if it re-uses the
same element name with different characteristics. WaveDrom includes
support for embedding multiple waveforms in a single webpage. All the
examples for this feature currently employ the same skin for all
waveforms in a given page. The inability to embed waveforms using
different skins, say, *default* and *narrow*, on the same page is an
oft-raised issue.

WaveDrom 24.01 initially addressed this issue by prefixing each brick
element in the *defs* section and the utilized class names in the
*style* section using a skin-based identifier. However, this doesn\'t
address the markers or user-defined styles. A [new configuration bit
(*wrapSvgInImg*)](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R55)
is available in WaveDrom 24.01 to prevent leakage of such elements
across different SVGs on the same page.

This bit is set to *true* by default to allow embedding of multiple SVGs
with different characteristics on the same page. The ObservableHQ
infrastructure for WaveDrom demonstrations (using the *wd* function)
captures the rendering output from the engine prior to the wrapping
operation. As a result, a live playground link is not available for
experimenting with this configuration bit. However, the demo files
linked below can be downloaded and rendered locally as long as the
source scripts in the header are also available at the appropriate
relative path locations.

The sample screenshot below is from the rendering of this [HTML
file](demo/test-leakage-wrapSvgInImg-true.html) with a segment of the
browser developer tools visible.

![](demo/style-Leakage-Test-wrapSvgInImg-true.png)

It can be seen that none of the three WaveJSON inputs have any whiff of
the *wrapSvgInImg* attribute. Each embedded waveform obeys the
parameters of its primary skin, and there is no leakage of the marker
element. The elements debugger on the right shows that the SVG is
wrapped as a data string inside an IMG tag for all the three renders.

Backwards compatibility can be obtained by explicity turning off the
*wrapSvgInImg* attribute, as shown in this [HTML
file](demo/test-leakage-wrapSvgInImg-false.html). A screenshot of this
rendering is shown below.

![](demo/style-Leakage-Test-wrapSvgInImg-false.png)

Two different aspects are worth pointing out here. The markers in the
diagrams with the *default* and *narrow* skins end up using the elements
in the *professional* skin. It is different from the standalone
rendering for both the WaveJSON inputs. Secondly, the browser developer
tools show that the SVGs are embedded directly in the page, and their
elements can be tracked from the same view.

This config attribute has no impact on the appearance of SVGs rendered
from standalone WaveJSON inputs. Advanced users might prefer to turn off
the feature to check up on the organization of the SVG elements using
the browser\'s developer tools. This is useful for debugging purposes,
but the end users of the software have no reason to bother with altering
the attribute\'s default value.

It must also be noted that the brick characteristics do not leak
irrespective of the configured *wrapSvgInImg* value. The leakage only
applies to the markers and optional custom styles.

#### Tweaking Arc Label Placement with *txtBaseline*

The SVG specifications provide a *dominant-baseline* attribute for text
elements. It allows the fine-tuning of the placement of the text
relative to the specified coordinates. In most cases, the default
settings combined with WaveDrom\'s coordinates computation provide an
acceptable appearance for the labels spcified in the WaveJSON *edge*
object. In rare cases, it might be necessary to tweak the placement. The
[new *txtBaseline* configuration
attribute](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R56)
fulfils this purpose.

[Configuring the *txtBaseline* Feature -
WaveJSON](demo/txtBaseline-options.json)

[ObservableHQ
Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-txtbaseline)

![](demo/txtBaseline-example.png)

This feature is recommended for use only in small diagrams with few arc
/ edge labels. Complex diagrams often require much more flexibility,
which is provided by the user-configurable \*arc*label\* style class in
the *customStyle\_ option. WaveDrom 24.01 also brings in *tspan* support
for edge labels, and that allows for per-label modification using native
CSS attributes.

#### Tuning Rendering Results with *customStyle*

WaveDrom 24.01 provides immense flexibility in tweaking the appearance
of various components of the timing diagram. A part of this flexibility
is enabled by support for the specification of custom styles using the
[new
*customStyle*](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R57)
string attribute. Users unfamiliar with SVG stylesheets should peruse
documentation related to [CSS
basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics)
and [class
selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Class_selectors)
in order to understand the usage of this option.

The appearance of various elements in waveforms generated by WaveDrom
24.01 is dictated by the *class* assigned to them during the rendering
process. The specifications of the classes involved in the default
appearance are documented
[here](https://github.com/Ganesh-AT/wavedrom/blob/wavedrom-24.01/bin/svg2js.js#L97-L127).
It includes the default style for all text elements as the first entry.
It must be noted that the specifications for the classes used by the
bricks are not part of the above extract, as they are sourced from the
skin\'s SVG.

The elements corresponding to the different style classes can be
inferred from the WaveDrom parlance for different components of a
rendered waveform. Two different renders are reproduced below to bring
them out. Almost all elements in the first waveform below are created
using straightforward WaveJSON features, except for the text label that
appears to be part of the edge specifications. The annotation is
actually rendered as a text label, as evident from this
[line](https://github.com/Ganesh-AT/wavedrom/blob/wavedrom-24.01/demo/customStyle-options.json#L66).

![](demo/WaveDrom-Anno.svg)

The aspects below deserve pointing out in the above diagram: \* Text
labels are rendered from the *tl* specifications in the *wave*
component, and is part of the new WaveDrom 24.01 grammar. \* Group
labels are the name given to the string specified as the first member of
any array that is a first-level component of the *signal* array. \*
Group paths are the name given to the shapes rendered to signify a
collection of signals. \* Arc labels are either the strings that follow
the node and arc shape components in the *edge* array components or the
node labels themselves. \* Arc paths denote the rendering of the lines
resulting from the arc shape specifications in the *edge* array
components

![](demo/WaveDrom-Anno-pw-Skin.svg)

WaveDrom renders diagrams using a collection of \'bricks\' from a
library (the *skin* specified in the *config* object). Each character in
the *wave* string corresponds to two bricks under the default settings
of *hscale* and *period* being 1. In the sub-cycle mode, each character
corresponds to one brick. The render above also shows piece-wise linear
waveforms specified using the *pw* feature of the *wave* attribute.

The *customStyle* attribute in the *config* object is a user-supplied
string that gets appended to the skin\'s *style* entry. The placement at
the end ensures that previous element and class entries can be
completely overridden, if desired. Obviously, style sets with new class
names can also be specified. The WaveDrom engine supports pre-defined
class names for specific elements. Custom class names can be used for
others.

The table below summarizes the different ways to fine-tune the
appearance of various elements.

```{=html}
<table style="width:100%">
    <tr>
        <td style="text-align:center;vertical-align:middle;width:17.5%"><b>Element</b></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%"><b>Waveform-Wide Customization</b></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%"><b>Per-Lane Customization</b></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%"><b>Per-Element Customization</b></td>
    </tr>
    <tr>
        <td colspan="4">&nbsp;</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Arc Paths</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.arc_path{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Custom classes in <i>config.customStyle</i> referenced in the edge specifier</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Group Paths</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.group_path{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Available</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Arc Labels</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.arc_label{} &amp; text{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Edge labels support <i>tspan</i>, but per-element customization for visible named nodes is not available.</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Group Labels</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.group_label{} &amp; text{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Group labels support <i>tspan<i></td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Lane Labels</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.lane_label{} &amp; text{} in <i>config.customStyle</i></td>
        <td colspan="2" style="text-align:center;vertical-align:middle;width:27.5%">Lane labels (signal names) can be specified as <i>tspan</i> entries</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Data Labels</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.data_label{} &amp; text{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Custom classes in <i>config.customStyle</i> referenced as <i>dlClass</i>, or style directly specified in <i>dlStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Data labels can be <i>tspan</i> entries</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Text Labels</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">text{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Custom classes in <i>config.customStyle</i> referenced as <i>tlClass</i>, or style directly specified in <i>tlStyle</i>.<br/>Finer customization is possible with <i>tspan</i> support.</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Piece-Wise Linear Paths</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Available</td>
        <td colspan="2" style="text-align:center;vertical-align:middle;width:55%">Custom classes in <i>config.customStyle</i> referenced as <i>pwClass</i>, or style directly specified in <i>pwStyle</i>.<br/>Different styles in the same lane can be obtained using the <i>overlayOnLane</i> feature.</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Bricks in Skin</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%"><i>skin</i> attribute in the _config_ object</td>
        <td colspan="2" style="text-align:center;vertical-align:middle;width:55%"><i>overrideSkin</i> in the signal lane, if such a skin is already available.<br/>Custom classes in <i>config.customStyle</i> referenced as <i>skinClass</i>, or style directly specified in <i>skinStyle</i>.<br/>Finer customization involving mixture of different skin styles in the same lane can be obtained using the <i>overlayOnLane</i> feature.<br/>In the event of none of the above options being applicable to requirements, the <i>pw</i> feature in the <i>wave</i> component can be used to create a piece-wise linear segment.</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Tick &amp; Tock Labels</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">text{} and .muted{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Unavailable, but the <i>tl</i> feature in the <i>wave</i> component can be used as a workaround.</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Marks</a>
        <td style="text-align:center;vertical-align:middle;width:27.5%">.gmarks{} in <i>config.customStyle</i></td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Not Applicable</td>
        <td style="text-align:center;vertical-align:middle;width:27.5%">Unavailable, but the <i>pw</i> feature in the <i>wave</i> component can be used as a workaround.</td>
    </tr>
    <tr>
        <td style="vertical-align:middle;">Header &amp; Footer Text</a>
        <td colspan="3" style="text-align:center;vertical-align:middle;width:82.5%">text{} in _config.customStyle_<br/>Entries can be specified using _tspan_ features.</td>
    </tr>
</table>
```
The [ObservableHQ
Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-tuning-rendering-results-with-customstyle)
links to the following SVGs by default.

![](demo/customStyle-Bare-Version.svg)

![](demo/pw.Skin.Mods-Bare-Version.svg)

Readers can uncomment different entries in the *customStyle* options to
figure out the impact on the rendering. The results of uncommenting all
of the classes in the custom style and enabling the per-lane styles are
presented below.

![](demo/customStyle-All-Applied.svg)

![](demo/pw.Skin.Mods-All-Applied.svg)

The *customStyle* feature allows extensive customization of the
rendering in conjunction with the other new features in the WaveDrom
24.01 grammar.

#### Waveform Rendering Palette Modification with *colorMode*

The WaveDrom 3.3.0 engine renders diagrams with a palette consisting of
black and a shade of blue. Some users may opt for colorful data bricks,
which may expand the palette further. Some applications require diagrams
that are either grayscale or rendered purely in black and white. While
it is possible to use post-processing software for this purpose, the sad
reality is that SVG support outside web browsers is a hit or miss when
it comes to complicated diagrams. It is a better strategy to support
such features natively prior to export, and WaveDrom 24.01 implements
that using the [new *colorMode* configuration
attribute](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R58-R60).

The default setting for this attribute is *normal*. In this mode, the
output of the core WaveDrom engine is passed upstream as-is for
rendering. The *grayscale* and *posterize* modes apply SVG filters to
the core engine\'s output.

[Configuring the *colorMode* Feature with the *grayscale* Option -
WaveJSON](demo/colorMode-grayscale.json)

![](demo/colorMode-grayscale.svg)

The *purebw* mode uses only two colors - black and white. This is
achieved by converting all visible *stroke* and visible non-white *fill*
specifications in the collated SVG styleset to black.

[Configuring the *colorMode* Feature with the *purebw* Option -
WaveJSON](demo/colorMode-purebw.json)

![](demo/colorMode-purebw.svg)

It is not advisable to use colored data bricks (*wave* characters 3
through 9) in WaveJSON that might eventually get rendered in the
*purebw* mode.

A demonstration of this configuration option is available in this
ObservableHQ Playground
[link](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-colormode-in-action).

### New Signal Attributes

#### Multi-Threshold Annotations with \*node_tlevel\* and \*node_tpos\*

WaveDrom 24.01 incorporates multiple schemes for annotating different
threshold levels. The more readable approach involves [two new signal
attributes - \*node_tlevel\* and
\*node_tpos\*](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R95-R96).

bla bla TODO bla bla

#### Tweaking Data Labels Rendering with *dlClass* and *dlStyle*

A timing diagram may have multiple data labels in different signal
lanes. Requirements dictating the modification of the appearance of all
data labels can be addressed by specifying the \*data*label\* class in
the *customStyle\_ config attribute. The rendering of data labels can
also be modified on a per-lane basis using the [new *dlClass* and
*dlStyle*
attributes](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R97-R98).
The new rendering styles can either be specified as a custom class in
the *customStyle* attribute, which is then used as the value for the
signal entry\'s *dlClass* attribute. Alternatively, the styles can be
specified as in-line CSS using the *dlStyle* attribute. WaveDrom 24.1
also supports the ultimate flexibility of modifying the rendering style
on a per-data label basis by incorporating *tspan* support for each
string.

bla bla TODO bla bla

#### Assembling Multiple Waveforms in a Single Lane with *overlayOnLane*

bla bla TODO bla bla

#### Tweaking Gaps Placement with *addGapsPhase*

bla bla TODO bla bla

#### Modifying Bricks on a Per-Lane Basis with *overrideSkin*, *skinClass*, and *skinStyle*

bla bla TODO bla bla

### New Wave Specifications

#### Arbitrary Text Labels with *tl*

WaveDrom 24.01 adds support for arbitrary text labels. This is
implemented as a feature set [parallel to the *pw*
functionality](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R110)
already available in WaveDrom 3.3.0. The [grammar for the new
feature](https://github.com/Ganesh-AT/wavedrom/compare/master...wavedrom-24.01#diff-5d9dd9d1500a808115d428b898d28cb38c6a5582a822ede99298dad4fd0b4bc4R125-R131)
proposes a comprehensive scheme to set the location, contents,
background, and style of the text to be rendered.

bla bla TODO bla bla

#### Multiple Piecewise Linear (PWL) Components and Text Labels in a Lane

bla bla TODO bla bla

#### Fine-Tuning PWL Renders with *pwClass* and *pwStyle*

bla bla TODO bla bla

### Revisiting the *edge* Architecture

#### Full *tspan* Support for Edge Labels

bla bla TODO bla bla

#### Coordinates Scheme for Node Locations

bla bla TODO bla bla

supports mathematical expressions

#### Tweaking Arc and Arrow Renders

bla bla TODO bla bla

#### Re-factored Edge Shape Implementation

bla bla TODO bla bla

### Miscellaneus Features

The updated WaveJSON grammar in WaveDrom 24.01 provides users with new
options to render timing diagrams. Beyond these, the new release also
introduces features not related directly to the WaveJSON input.

#### Pre-Export SVG Optimization

WaveDrom supports native export of rendered diagrams to SVG or PNG via a
context menu. This is available for embedded diagrams rendered via the
ProcessAll feature. The SVG exported by WaveDrom 3.3.0 includes all
element definitions in the used skin, even when the rendered diagram
doesn\'t make use of all of them. WaveDrom 24.01 supports multiple skins
in the same diagram, along with per-lane skin overrides and custom skin
styles. This may cause a linear increase in the number of element
definitions in the rendered SVG.

The SVG export process in WaveDrom 24.01 incorporates support for the
removal of unused *defs* elements. This optimization process is
triggered only during the export process, and is not part of the
real-time rendering flow. The extent of savings depends on the number of
skin elements actually used in the timing diagram. As an example, a
simple diagram with two clocks
\[[WaveJSON](demo/svg-optimize-demo.json)\] exported by WaveDrom 3.3.0
clocks in at [42549 bytes](demo/Clocks-3.3.0-Export.svg), while it is
only [8003 bytes](demo/Clocks-24.01.0-Export.svg) via WaveDrom 24.01.
This is despite the latter including metadata information with the
original WaveJSON source.

#### WaveJSON Metadata Inclusion in Exported SVG

WaveDrom 24.01 incorporates support for embedding the WaveJSON source
into the exported SVG. This is placed in a metadata element with a
*WaveJS* identifier. The software supports JavaScript code in its input,
if it acts as a pre-processor for generating the actual WaveJSON object
rendered by the core engine. The WaveJSON in the metadata section is
placed as received, and includes the optional pre-processing JavaScript
code as well.

An example of a SVG with metadata exported by WaveDrom 24.01 is
reproduced below.

![](demo/JS-Code-for-WaveJSON.svg)

Opening up the SVG in a text editor shows the embedded metadata being an
exact replica of the original source code.

![](demo/JS-Code-in-Metadata.png)

The source has to be enclosed within a comments section in order to pass
SVG 1.1 validation checks. The first line in this section also includes
the SVG-exporting WaveDrom\'s version information. The editor
application incorporates support for importing SVGs with such embedded
metadata.

#### Improved PNG Export

WaveDrom 3.3.0 exports rasterized PNG versions of rendered diagrams at
their native resolution. These do not respond well to scaling. WaveDrom
24.01 incorporates a pre-rasterizing scaling factor of 20 to provide
reasonable results. This factor is a constant for embedded diagrams, but
the editor application allows it to be configured.

#### Improved Dimensions Estimation for Text Elements

The initial releases of WaveDrom in the early 2010s utilized the
DOM-reliant getBBox() method to estimte the width of different text
elements. This estimation is important to determine the best possible
position for the element relative to the existing ones in the waveform.
The reliance on the DOM (document object model) meant that WaveDrom
needed a browser engine in order to do its work. A push towrds enabling
a browserless version with server-side rendering support resulted in the
removal of the DOM-reliant getBBox() method from the code base.

WaveDrom 24.01 offers flexibility in styling support for text elements.
Using pre-generated text widths for characters is not a suitable
solution when it is possible to vary the size and even line counts for
different text elements. WaveDrom 24.01 brings back support for the
getBBox() method in the presence of a browser engine, and falls back to
the legacy width estimation scheme otherwise. The implementation creates
a temporary render area where each text element is rendered for
determining the bounding box dimensions and then removed.

### Grouping of Text Elements for a Better *tspan* Experience

#### Fine-Tuning the *hbounds* Feature

The implementation of the *hbounds* feature in WaveDrom 3.3.0 allows for
one extra brick relative to the provided upper bound. There is no
allowance for specifying a non-integer bounds, and hence, the resultant
image always ended up with an odd number of bricks. In addition,
out-of-bounds arcs continue to remain in the diagram.

WaveDrom 24.01 incorporates support for half-cycle specifications in the
*max* component of the *hbounds\[min:max\]* attribute. It also fixes the
rendering of the out-of-bounds arcs. Piecewise linear waveforms and the
newly added arbitrary text labels are also handled in a similar manner.
All these ensure that the original intention of the *hbounds* feature
(isolating a range of cycles from a larger waveform) is retained.

An example is available in this [HTML
file](demo/test-hbounds-max-legacy.html) utilizing the public release of
WaveDrom. The same set of scripts are rendered using the WaveDrom 24.01
release [here](demo/test-hbounds-max.html) using relative paths to the
WaveDrom JS library. A comparative screenshot of the rendering as of
December 22, 2023 is reproduced below.

![](demo/hbounds-test.png)

Text labels with coordinates outside the intended range of cycles may
intrude into the *hbounds* area, depending on their length and location.
In order to maintain consistency, users need to keep the following
aspects in mind when specifying *hbounds* in diagrams with arbitrary
text labels: - Text labels with coordinates outside the specified
hbounds range (including the additional brick retained for backwards
compatibility) are not rendered - Conversely, the WaveDrom engine
renders all text with coordinates within the specified hbounds, and then
crops the rendering to the selected range. - It is up to the user to
ensure that any rendered text meant for retention in the clipped
waveform remains within bounds - Text labels are anchored with specified
coordinates as the mid-point.

The mid-point anchoring of text labels can be altered (for either start
or end alignment) using the *customStyle* and *tlClass* / *tlStyle*
options. The usage of this option is shown in the scripts linked in the
above example.

[ObservableHQ
Playground](https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-hbounds-pw-tl)

The live playground link above can help users get a better understanding
of how these features work together. Key aspects to try out include
altering the *min* and *max* of the *hbounds* attribute, and modifying
the text label coordinates independently.

#### Supporting Multiple Transition Slopes for Node Placement

bla bla TODO bla bla

related to \*node_tlevel\* and \*node_tpos\* features

## Bug Fixes and Issue Resolutions

bla bla TODO bla bla intro component

### Fixing up Subcycles Support

include discussion of gaps and nodes issue #213 in resolve library

### Handling Phase Artifacts

bla bla TODO bla bla

### SVG 1.1 Validation Checks

bla bla TODO bla bla

### Cleaning up the *tick* & *tock* Implementation

bla bla TODO bla bla

### Text Labels on Single-Bit Bricks

bla bla issue #302 and #310 in resolve library TODO bla bla

### Multi-Line Data Labels

issue #341 in resolve library

## Enabling a Plugin Architecture

bla bla BIG TODO bla bla intro component

https://observablehq.com/@ganesh-at-ws/wavedrom-24-01-using-plugins

### Custom Wave Specifications - Trigonometric Functions

Signal object supports following attributes: { name:
\'trig-signal-name\', phase: float, overlayOnLane: lane-number, wave: \[
\'sin\|cos\', { f: float, repeat: int, amp: float, phi: float_in_degrees
} \] }

bla bla TODO bla bla

### Custom Wave Specifications - Asynchronous Signals

{ name: \'async-signal-name\', overlayOnLane: lane-number wave: \[
\'async\', { seq: \'\', // 0 or 1 or z ; x is TODO cTimes: \[ \], rTime:
float, // fraction of a period fTime: float, // fraction of a period
sharpz: bool, // false by default } }

sig = { wave: \[ \'async\', { seq: \'0101\', cTimes:
\[2.1,3,5,7.3,8.2\], rTime: 0.2, fTime: 0.3, sharpz: true } \], }

bla bla TODO bla bla

### Custom Wave Specifications - Bipolar Signals

bla bla TODO bla bla

## Project Roadmap

bla bla TODO bla bla

### Known Issues

bla bla TODO bla bla

### Pull-Request Submission Invites

bla bla TODO bla bla
