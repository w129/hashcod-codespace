/**
 * Tabby Terminal Controller for Hashcod Codespace
 * Based on Tabby (https://github.com/Eugeny/tabby)
 *
 * Copyright (c) 2017 Eugeny Pankov
 * Copyright (c) 2026 DIKTATCART / Hashcod
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function (window, document) {
    'use strict';

    const TABBY_SVG_TERMINAL = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-3l3-3-3-3 1.41-1.41L12.83 12l-3.42 3.41L8 15zm5 0h5v2h-5v-2z"/></svg>';
    const TABBY_SVG_PLUS = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
    const TABBY_SVG_PROFILE = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
    const TABBY_SVG_GEAR = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
    const TABBY_SVG_PALETTE = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.59 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5s1.5.67 1.5 1.5S10.83 8 10 8zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 5 14 5s1.5.67 1.5 1.5S14.83 8 14 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 9 17 9s1.5.67 1.5 1.5S17.83 12 17 12z"/></svg>';
    const TABBY_SVG_SEARCH = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
    const TABBY_SVG_TRASH = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    const TABBY_SVG_EXPORT = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
    const TABBY_SVG_GATEWAY = '<svg class="tabby-icon-svg gateway-crescent-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 100 100"><path fill="currentColor" d="M 21.693359 7.1972656 A 1.0001 1.0001 0 0 0 21.484375 7.2128906 C 16.219222 8.187171 11.3871 9.4963897 7.21875 11.34375 A 1.0001 1.0001 0 0 0 6.625 12.201172 C 6.2031567 19.649719 6.1391302 27.227265 6.625 34.994141 A 1.0001 1.0001 0 0 0 7.4921875 35.921875 C 7.5562145 35.950095 7.651101 35.993165 7.8027344 36.072266 C 8.1651191 36.261307 8.7105544 36.569927 9.3710938 36.957031 C 10.692172 37.73124 12.480841 38.821679 14.341797 39.972656 C 14.93395 40.338896 15.179031 40.49706 15.773438 40.867188 C 14.804338 41.670438 14.069932 42.828224 13.560547 44.171875 C 12.78613 46.214625 12.464887 48.74142 12.554688 51.478516 A 1.0001 1.0001 0 0 0 12.896484 52.199219 C 13.647227 52.854863 14.343243 53.448968 15.023438 54.027344 C 15.022075 54.060576 15.021103 54.075292 15.019531 54.113281 C 14.661531 63.806281 18.270375 68.077125 21.359375 69.953125 C 22.835375 70.849125 24.250937 71.300781 25.585938 71.300781 C 26.074938 71.300781 26.552531 71.238187 27.019531 71.117188 C 27.996151 70.863585 28.747102 70.37994 29.306641 69.896484 A 1.0001 1.0001 0 0 0 29.755859 70.501953 C 41.643284 77.689873 47.580222 80.893133 51.044922 82.3125 C 54.509622 83.731867 55.766125 83.292261 57.115234 83.199219 C 59.016457 83.068143 61.309417 81.976436 63.291016 80.951172 C 65.014669 80.059367 66.05599 79.402972 66.398438 79.191406 A 1.0001 1.0001 0 0 0 66.974609 79.433594 C 66.666775 79.405744 67.171796 79.549389 67.679688 79.496094 C 67.883521 79.474703 68.095904 79.405325 68.308594 79.308594 C 68.402852 82.487297 69.423379 92.020319 78.322266 95.0625 C 79.593266 95.4975 80.729422 95.671875 81.732422 95.671875 C 83.704422 95.671875 85.165344 94.994062 86.152344 94.289062 C 88.373344 92.701063 89.753859 89.866672 89.755859 86.888672 C 89.756786 84.588888 89.004895 81.738356 87.539062 78.419922 C 87.640303 78.359302 87.754902 78.310012 87.849609 78.244141 C 88.874729 77.531137 89.514307 76.420954 89.417969 75.255859 C 89.364729 74.612005 89.119327 73.914582 88.693359 72.996094 C 88.267392 72.077605 87.650323 70.994066 86.820312 69.84375 C 85.290934 67.724172 83.025923 65.386494 79.933594 63.544922 C 80.297255 62.645271 80.621224 61.415224 80.5 59.292969 C 80.443877 58.307 80.038339 56.749329 79.388672 54.701172 C 78.739005 52.653014 77.839251 50.222373 76.771484 47.910156 C 75.723382 45.64052 74.824187 43.740727 73.933594 42.300781 C 73.148408 41.031264 72.372426 40.026267 71.287109 39.609375 C 71.905394 38.584632 72.152038 37.677387 72.169922 36.935547 C 72.177722 36.612002 72.099642 36.407213 72.046875 36.160156 L 75.179688 34.488281 A 1.0001 1.0001 0 0 0 75.671875 33.876953 C 75.671875 33.876953 75.936978 32.929919 75.71875 31.761719 C 75.69822 31.651809 75.600683 31.520994 75.570312 31.40625 C 76.301096 31.143655 78.650129 30.290581 80.529297 29.710938 A 1.0001 1.0001 0 0 0 80.205078 27.751953 A 1.0001 1.0001 0 0 0 79.939453 27.800781 C 77.874507 28.43773 75.174926 29.41742 74.648438 29.607422 C 74.229055 29.064659 73.744384 28.524524 72.998047 28.085938 A 1.0001 1.0001 0 0 0 72.585938 27.953125 C 71.587665 27.856992 70.624021 27.81656 69.689453 27.816406 L 71.914062 20.439453 A 1.0001 1.0001 0 0 0 72.330078 20.525391 L 75.384766 20.533203 C 77.079971 20.537103 78.60621 20.124678 79.353516 18.851562 C 80.100821 17.578449 79.762391 15.941875 78.695312 14.097656 C 78.05838 12.996854 76.859323 12.467498 75.857422 12.65625 C 74.855521 12.845002 74.062045 13.452752 73.353516 14.107422 C 71.936457 15.416761 70.873047 17.097656 70.873047 17.097656 A 1.0001 1.0001 0 0 0 70.755859 17.349609 L 67.576172 27.890625 C 62.738099 28.2463 58.855703 29.783423 55.955078 31.429688 C 54.034158 32.519914 52.535645 33.656502 51.464844 34.519531 C 50.929443 34.951046 50.499495 35.31699 50.195312 35.558594 C 50.043222 35.679396 49.919609 35.769229 49.853516 35.8125 C 49.787426 35.85577 49.739479 35.826392 49.986328 35.789062 A 1.0001 1.0001 0 0 0 49.195312 37.113281 L 49.566406 38.15625 A 1.0001 1.0001 0 0 0 49.474609 38.179688 C 47.213706 38.87708 43.679687 40.158203 43.679688 40.158203 A 1.0002829 1.0002829 0 1 0 44.361328 42.039062 C 44.361328 42.039062 47.903356 40.756451 50.064453 40.089844 A 1.0001 1.0001 0 0 0 50.234375 40.023438 L 50.664062 41.226562 A 1.0001 1.0001 0 0 0 51.810547 41.867188 C 51.810547 41.867188 52.904907 41.639063 54.259766 41.490234 C 55.614624 41.341406 57.257233 41.323238 58.027344 41.560547 C 58.301983 41.645177 58.764953 42.056669 59.087891 42.507812 C 59.239315 42.719353 59.353565 42.914264 59.439453 43.068359 C 59.147334 43.213675 58.844556 43.360732 58.613281 43.490234 C 57.161561 44.303127 56.329114 45.528523 55.921875 46.660156 C 55.514636 47.79179 55.48243 48.796702 55.615234 49.515625 C 55.697374 49.959974 55.898754 50.608835 56.193359 51.664062 C 56.488215 52.720185 56.859772 54.06845 57.212891 55.488281 C 57.919127 58.327944 58.509969 61.566643 58.369141 62.929688 C 58.322061 63.383961 58.229878 63.963008 58.113281 64.595703 C 57.20855 64.150167 55.832441 63.464724 54.023438 62.498047 C 51.345002 61.066771 48.314582 59.240891 47.492188 58.412109 C 46.67244 57.585996 46.294472 56.140314 46.195312 54.859375 C 46.103384 53.671857 46.216312 52.790417 46.234375 52.65625 C 46.303418 52.547 46.373112 52.43793 46.429688 52.326172 C 46.958061 51.282428 47.045781 50.023886 46.890625 48.783203 C 46.735469 47.542521 46.334048 46.313209 45.521484 45.404297 A 1.0001 1.0001 0 0 0 45.519531 45.404297 C 44.074425 43.788634 40.85678 41.522161 37.732422 39.404297 L 38.908203 17.896484 A 1.0001 1.0001 0 0 0 38.318359 16.927734 C 33.230698 14.657039 27.861522 11.444052 22.253906 7.3867188 A 1.0001 1.0001 0 0 0 21.693359 7.1972656 z M 21.470703 9.2675781 C 26.301291 12.735686 30.972769 15.573939 35.484375 17.763672 C 33.196822 18.526671 24.838085 21.315617 23.914062 21.623047 L 8.84375 12.871094 C 12.534587 11.326671 16.792001 10.152737 21.470703 9.2675781 z M 76.433594 14.585938 C 76.604977 14.571009 76.702215 14.649087 76.962891 15.099609 C 77.864812 16.65839 77.831351 17.493005 77.628906 17.837891 C 77.426462 18.182776 76.747466 18.536318 75.388672 18.533203 L 72.492188 18.525391 L 72.619141 18.101562 C 72.677011 18.013723 73.597145 16.605297 74.710938 15.576172 C 75.285032 15.045717 75.89926 14.683123 76.228516 14.621094 C 76.310829 14.605586 76.376466 14.590914 76.433594 14.585938 z M 8.5175781 14.992188 L 22.865234 23.324219 L 22.865234 27.927734 L 9.2226562 19.496094 C 8.7613846 17.350082 8.5720744 15.972835 8.5019531 15.388672 C 8.5075764 15.256584 8.511712 15.124198 8.5175781 14.992188 z M 36.822266 19.427734 L 36.550781 24.396484 C 35.824878 24.655284 33.776805 25.386566 30.947266 26.376953 C 29.301184 26.95311 27.638452 27.529798 26.357422 27.960938 C 25.753257 28.164273 25.255381 28.328215 24.865234 28.451172 L 24.865234 23.412109 C 26.304797 22.932816 35.450445 19.884921 36.822266 19.427734 z M 9.5390625 20.867188 L 22.865234 29.101562 L 22.865234 32.558594 L 10.927734 25.703125 C 10.342699 23.959094 9.8895073 22.327478 9.5390625 20.867188 z M 36.492188 25.476562 L 36.292969 29.089844 L 24.865234 33.128906 L 24.865234 29.496094 C 24.931358 29.476366 24.988646 29.459725 25.072266 29.433594 C 25.482261 29.305463 26.033546 29.125009 26.677734 28.908203 C 27.96611 28.474592 29.6293 27.897156 31.277344 27.320312 C 33.91151 26.39831 35.657038 25.774512 36.492188 25.476562 z M 11.443359 27.152344 L 22.865234 33.710938 L 22.865234 42.794922 C 22.722238 42.739031 22.548906 42.689654 22.384766 42.638672 C 21.945403 42.363204 21.19746 41.899908 20.628906 41.542969 C 16.136837 37.574909 13.268042 32.109922 11.443359 27.152344 z M 69.71875 29.832031 C 70.497771 29.833956 71.301925 29.86949 72.130859 29.941406 C 73.242549 30.660393 73.62588 31.454005 73.751953 32.128906 C 73.846743 32.636332 73.780957 32.798195 73.748047 32.984375 L 70.671875 34.625 C 69.800774 33.006783 68.133337 31.988457 66.277344 32.185547 L 66.277344 32.183594 C 65.312374 32.285634 64.15889 32.683443 63.226562 33.603516 C 62.294235 34.523588 61.672733 35.987574 61.818359 37.865234 C 61.859107 38.393106 62.000807 38.86113 62.191406 39.292969 C 61.015516 38.53813 59.406599 37.762899 57.59375 37.115234 C 55.176558 36.25166 54.819944 35.14239 54.753906 34.554688 C 55.407954 34.100335 56.128635 33.631214 56.941406 33.169922 C 60.030516 31.416683 64.265604 29.818559 69.71875 29.832031 z M 36.234375 30.171875 L 35.773438 38.609375 A 1.0001 1.0001 0 0 0 35.308594 38.998047 L 24.865234 43.255859 L 24.865234 34.191406 L 36.234375 30.171875 z M 66.488281 34.173828 C 68.15835 33.996482 69.624667 35.412348 69.265625 37.798828 C 69.165945 38.462581 68.731002 39.039174 68.121094 39.455078 C 67.511185 39.870982 66.740315 40.066134 66.277344 40.025391 C 65.147148 39.925991 63.926865 39.192512 63.8125 37.710938 C 63.704126 36.313598 64.098687 35.552521 64.630859 35.027344 C 65.163032 34.502166 65.921251 34.233788 66.488281 34.173828 z M 36.210938 40.791016 C 39.445768 42.989343 42.952124 45.534014 44.029297 46.738281 C 44.422733 47.178369 44.788406 48.088933 44.90625 49.03125 C 45.024094 49.973567 44.89011 50.940619 44.646484 51.421875 C 44.460306 51.78965 43.389848 52.869684 41.955078 53.619141 C 40.520308 54.368598 38.723668 54.890062 37 54.738281 C 36.808856 54.72145 36.576279 54.673597 36.318359 54.603516 C 36.317579 54.193764 36.265742 50.729165 34.523438 49.941406 C 33.424311 49.445179 29.494017 47.197975 26.083984 44.921875 L 36.210938 40.791016 z M 70.414062 41.427734 C 70.745795 41.499104 71.442265 42.074008 72.232422 43.351562 C 72.957106 44.52326 73.779367 46.230623 74.712891 48.240234 L 60.611328 53.757812 C 60.115444 51.955188 59.667705 50.379165 59.482422 49.732422 C 59.156995 48.598444 59.57195 46.599008 59.972656 45.041016 C 61.196424 44.404463 63.380935 43.458043 65.496094 42.697266 C 66.657839 42.279411 67.793142 41.917319 68.708984 41.6875 C 69.624827 41.457681 70.418567 41.428706 70.414062 41.427734 z M 16.90625 42.521484 A 1.0005878 1.0005878 0 0 0 16.929688 42.630859 C 17.181039 43.485686 17.578508 44.150955 18.037109 44.699219 C 17.284061 45.940498 16.782273 47.469943 16.552734 49.310547 C 16.479734 49.898547 16.758188 50.477359 17.242188 50.818359 C 21.883188 54.691359 27.484656 58.981391 33.847656 63.025391 C 34.418656 63.388391 35.168047 62.944531 35.123047 62.269531 L 34.962891 59.828125 C 34.68515 58.119567 34.260573 56.768437 33.90625 55.84375 C 34.940334 56.317481 35.911268 56.649905 36.826172 56.730469 C 39.054504 56.926688 41.184129 56.278871 42.880859 55.392578 C 43.355345 55.144729 43.785807 54.884398 44.1875 54.615234 C 44.193642 54.750784 44.190229 54.872311 44.201172 55.013672 C 44.318763 56.532733 44.703013 58.440427 46.072266 59.820312 C 47.438871 61.197531 50.357763 62.808948 53.080078 64.263672 C 55.305443 65.45284 57.005443 66.28524 57.675781 66.611328 C 57.39902 67.749561 57.063557 68.949006 56.660156 70.074219 C 56.202723 71.350146 55.669029 72.525046 55.125 73.359375 C 54.580971 74.193704 54.030133 74.603502 53.757812 74.660156 C 53.726993 74.666556 53.301639 74.656556 52.736328 74.484375 C 52.171017 74.31222 51.448996 74.018446 50.648438 73.640625 C 49.047317 72.884984 47.124012 71.797617 45.28125 70.677734 C 43.438488 69.557851 41.671121 68.405627 40.355469 67.515625 C 39.697642 67.070624 39.153063 66.690109 38.771484 66.416016 C 38.580695 66.278969 38.428421 66.167948 38.332031 66.09375 C 38.293691 66.06424 38.272799 66.047093 38.255859 66.033203 A 1.0001 1.0001 0 0 0 36.708984 67.292969 C 36.881323 67.541577 36.893177 67.498815 36.945312 67.542969 C 36.997453 67.587119 37.050193 67.629169 37.113281 67.677734 C 37.239457 67.774864 37.401573 67.895957 37.603516 68.041016 C 38.007402 68.331133 38.564217 68.718532 39.234375 69.171875 C 40.574691 70.078561 42.364074 71.245352 44.242188 72.386719 C 46.1203 73.528086 48.083822 74.641673 49.794922 75.449219 C 50.650472 75.852992 51.440003 76.181507 52.152344 76.398438 C 52.276014 76.436099 52.387078 76.450168 52.505859 76.482422 C 52.490114 76.498439 52.386719 76.574219 52.386719 76.574219 C 52.600719 76.745219 56.510359 77.396563 58.193359 76.476562 C 59.876359 75.556562 62.345328 67.456141 62.736328 64.744141 C 62.883286 63.72743 62.544875 61.649984 62.033203 59.341797 C 63.052164 58.919796 65.627325 57.855381 69.1875 56.367188 C 71.290841 55.487966 73.384774 54.607444 74.933594 53.947266 C 75.693906 53.623185 76.312907 53.357716 76.75 53.164062 C 77.017512 53.906438 77.269072 54.634028 77.482422 55.306641 C 78.108755 57.281233 78.477076 58.969219 78.501953 59.40625 C 78.610551 61.307443 78.4182 62.057689 78.109375 62.763672 C 77.916166 62.72444 77.701933 62.688163 77.466797 62.666016 C 76.497885 62.574756 75.129109 62.653776 73.482422 63.261719 C 70.136276 64.497492 66.7285 67.593778 65.636719 70.931641 C 64.753472 73.631958 64.890024 75.334955 65.265625 77.537109 C 64.886525 77.770368 63.975919 78.344514 62.373047 79.173828 C 60.473645 80.156564 58.123293 81.126154 56.978516 81.205078 C 55.282625 81.322036 55.027035 81.783774 51.802734 80.462891 C 48.616739 79.1577 42.697074 75.974897 31.117188 68.982422 C 30.460857 65.70511 29.725053 63.843408 28.023438 62.080078 C 27.715048 61.71452 27.387005 61.379833 27.017578 61.126953 C 26.962037 61.088878 26.878116 61.025329 26.8125 60.978516 C 24.505501 59.003224 20.832856 56.415449 14.574219 50.988281 C 14.540509 48.630486 14.827247 46.475123 15.431641 44.880859 C 15.828034 43.835255 16.32804 43.049654 16.90625 42.521484 z M 75.130859 49.150391 C 75.589307 50.168106 76.019009 51.204938 76.404297 52.220703 C 76.394874 52.225096 76.389508 52.228803 76.376953 52.234375 C 75.948256 52.4246 75.313246 52.698183 74.541016 53.027344 C 72.996554 53.685665 70.905018 54.56458 68.802734 55.443359 C 65.319287 56.899481 62.812457 57.936464 61.800781 58.355469 C 61.505239 57.098179 61.192706 55.926241 60.871094 54.730469 L 75.130859 49.150391 z M 18.3125 56.757812 C 22.08084 59.819512 24.518881 61.571571 26.003906 62.904297 C 26.119569 63.008098 26.212456 63.101838 26.318359 63.201172 C 26.038966 64.391982 25.415021 65.288088 24.492188 65.623047 C 22.539188 66.331047 20.003172 64.27525 18.826172 61.03125 C 18.275813 59.513877 18.12217 58.006318 18.3125 56.757812 z M 76.693359 64.632812 C 76.910114 64.630023 77.10615 64.639941 77.279297 64.65625 C 77.959012 64.72027 78.199629 64.850549 78.208984 64.855469 C 81.392874 66.584868 83.692481 68.925474 85.199219 71.013672 C 85.955084 72.06123 86.51103 73.04466 86.878906 73.837891 C 87.246783 74.631121 87.41502 75.289776 87.425781 75.419922 C 87.457441 75.802827 87.304411 76.186067 86.707031 76.601562 C 86.109651 77.01706 85.066936 77.373165 83.619141 77.414062 C 82.567128 77.444113 80.163931 76.345474 77.888672 75.146484 C 76.751042 74.546989 75.614638 73.944555 74.558594 73.494141 C 73.750708 73.149568 73.002087 72.869645 72.244141 72.808594 C 74.164098 72.763806 76.941819 73.43228 78.205078 73.660156 C 79.857078 73.958156 79.462563 73.237891 77.101562 70.587891 C 75.241644 68.500307 72.066006 67.565374 70.681641 67.337891 C 71.787807 66.372478 73.023379 65.564268 74.175781 65.138672 C 75.199767 64.760627 76.043096 64.641181 76.693359 64.632812 z M 73.191406 77.443359 C 74.798854 77.527653 76.864693 79.932115 78.082031 83.287109 C 79.454031 87.070109 79.226313 90.625563 77.570312 91.226562 C 75.914312 91.827562 73.458938 89.246891 72.085938 85.462891 C 71.110733 82.775217 70.960303 80.223967 71.539062 78.744141 C 71.679977 79.129575 71.791612 79.441275 71.935547 79.833984 C 72.407695 81.122185 72.87822 82.401426 73.224609 83.347656 C 73.397804 83.820771 73.539137 84.209704 73.634766 84.474609 C 73.679756 84.599228 73.712945 84.690778 73.734375 84.751953 A 1.0001 1.0001 0 0 0 73.841797 85.021484 C 73.855367 85.045614 73.935347 85.159911 73.935547 85.160156 C 73.935745 85.160401 75.371014 85.287179 75.371094 85.287109 C 75.371174 85.28704 75.709021 84.435929 75.708984 84.435547 C 75.708948 84.435165 75.696246 84.336357 75.691406 84.314453 C 75.672066 84.226843 75.667739 84.228602 75.662109 84.210938 C 75.650859 84.175597 75.641976 84.148808 75.628906 84.111328 C 75.602766 84.036378 75.564566 83.93245 75.515625 83.796875 C 75.417745 83.525726 75.275166 83.134385 75.101562 82.660156 C 74.754358 81.711699 74.284227 80.433534 73.8125 79.146484 C 73.587084 78.531463 73.404318 78.027177 73.191406 77.443359 z"></path></svg>';

    const TabbyTerminal = {
        tabs: [],
        activeTabId: 'tab_default',
        currentTheme: 'default',
        activeAutoIndex: -1,

        themes: [
            { id: 'default', name: 'Hashcod Deep Black', bg: '#000000', accent: '#38bdf8', fg: '#e2e8f0' },
            { id: 'solarized-dark', name: 'Solarized Dark', bg: '#002b36', accent: '#268bd2', fg: '#839496' },
            { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9', fg: '#f8f8f2' },
            { id: 'one-dark', name: 'One Dark', bg: '#282c34', accent: '#61afef', fg: '#abb2bf' },
            { id: 'tabby-light', name: 'Tabby Standard Light', bg: '#fafafa', accent: '#5294e2', fg: '#2e3440' }
        ],

        profiles: [
            { id: 'default', name: 'Hashcod Platform Shell', icon: '🚀', desc: 'Consola principal y ejecución de comandos plataforma', defaultCmd: 'status' },
            { id: 'claude', name: 'Claude Code AI Assistant', icon: '🤖', desc: 'CLI oficial de Claude Code (OAuth / Anthropic API Key)', defaultCmd: 'claude' },
            { id: 'ubuntu', name: 'Ubuntu Linux Terminal', icon: '🐧', desc: 'Consola web completa de Ubuntu Linux con bash interactivo', defaultCmd: 'ubuntu' },
            { id: 'zylon', name: 'Zylon PrivateGPT', icon: '🧠', desc: 'Inferencia de modelos de lenguaje e IA privada en local', defaultCmd: 'zylon' },
            { id: 'libreoffice', name: 'LibreOffice Suite', icon: '📄', desc: 'Suite ofimática (Writer, Calc, Impress, Draw, Math, Base)', defaultCmd: 'libreoffice' },
            { id: 'tiptap', name: 'TipTap Word Editor', icon: '📝', desc: 'Editor de documentos estructurados en hoja directa', defaultCmd: 'tiptap' },
            { id: 'prs', name: 'PRS Code Collaborative IDE', icon: '💻', desc: 'IDE de programación y compartición de código por selección', defaultCmd: 'prs-code' },
            { id: 'streamlit', name: 'Streamlit Python Apps', icon: '⚡', desc: 'Panel de herramientas y ejecución de aplicaciones Streamlit', defaultCmd: 'streamlit' },
            { id: 'toolkit', name: 'Toolkit & PDF WASM/OCR', icon: '🛠️', desc: 'Extractor PDF a Markdown con WebAssembly y motor OCR Tesseract', defaultCmd: 'toolkit' },
            { id: 'agents', name: '50+ Engineering AI Agents', icon: '👥', desc: 'Catálogo de agentes de ingeniería de software especializados', defaultCmd: 'agents' },
            { id: 'pqc', name: 'PQC Dilithium-5 Vault', icon: '🔒', desc: 'Explorador de base de datos con sellado post-cuántico NIST Nivel 5', defaultCmd: 'set_i code' },
            { id: 'github', name: 'GitHub Repos & Git', icon: '🐙', desc: 'Catálogo de repositorios con licencias verificadas y clonación', defaultCmd: 'repos' },
            { id: 'supabase', name: 'Supabase Cloud & Storage', icon: '☁️', desc: 'Diagnóstico de buckets de almacenamiento y persistencia Postgres', defaultCmd: 'supabase' },
            { id: 'keys', name: 'Hashcod Keys Vault', icon: '🔑', desc: 'Administrador de credenciales API cifradas con AES-256-GCM', defaultCmd: 'keys' },
            { id: 'gateway', name: 'Gateway PQC Crescent', icon: '🌙', desc: 'Portal de compartición segura de carpetas con Dilithium-5', defaultCmd: 'gateway' }
        ],

        catalog: [
            { cmd: 'repos', desc: 'Catálogo global de GitHub con licencias verificadas', category: 'GitHub' },
            { cmd: 'clone facebook/react', desc: 'Clonar o actualizar repositorio GitHub vía SSH/HTTPS', category: 'Git' },
            { cmd: 'save facebook/react', desc: 'Guardar repositorio en base de datos persistente', category: 'Storage' },
            { cmd: 'set_i code', desc: 'Super base de datos con archivos y hashes Dilithium-5', category: 'Database' },
            { cmd: 'claude', desc: 'Lanzar Claude Code CLI (Asistente IA de desarrollo)', category: 'AI' },
            { cmd: 'ubuntu', desc: 'Abrir terminal Ubuntu Linux interactiva', category: 'Terminal' },
            { cmd: 'zylon', desc: 'Abrir Zylon PrivateGPT para inferencia local privada', category: 'AI' },
            { cmd: 'libreoffice', desc: 'Abrir suite ofimática completa LibreOffice', category: 'Office' },
            { cmd: 'tiptap', desc: 'Abrir editor de documentos estilo Word basado en TipTap', category: 'Office' },
            { cmd: 'streamlit', desc: 'Panel de control de apps y microservicios Python Streamlit', category: 'Python' },
            { cmd: 'toolkit', desc: 'Inspector PDF WASM con extracción Markdown y OCR', category: 'Toolkit' },
            { cmd: 'agents', desc: 'Explorar catálogo de 50+ Agentes de Ingeniería de IA', category: 'AI' },
            { cmd: 'opencrypt', desc: 'Libro mayor de códigos criptográficos únicos OpenCryptG', category: 'Security' },
            { cmd: 'keys', desc: 'Abrir bóveda de claves API cifradas con AES-256-GCM', category: 'Security' },
            { cmd: 'tokens', desc: 'Consultar cupo mensual y transacciones de tokens', category: 'System' },
            { cmd: 'gateway', desc: 'Portal PQC Crescent Gateway para compartir carpetas', category: 'Security' },
            { cmd: 'prs-code', desc: 'Lanzar IDE colaborativo PRS Code en ventana independiente', category: 'Apps' },
            { cmd: 'macos', desc: 'Abrir entorno virtualizado macOS inside', category: 'Apps' },
            { cmd: 'chromeos', desc: 'Abrir entorno virtualizado ChromeOS play', category: 'Apps' },
            { cmd: 'upload', desc: 'Subir archivo con sellado criptográfico post-cuántico PQC', category: 'Files' },
            { cmd: 'supabase', desc: 'Diagnóstico de Supabase Storage y conexión Postgres', category: 'Cloud' },
            { cmd: 'ssh_key', desc: 'Mostrar y copiar clave pública Ed25519 para GitHub', category: 'Security' },
            { cmd: 'status', desc: 'Diagnóstico del servidor, memoria, navegadores y PQC', category: 'System' },
            { cmd: 'dil_fs', desc: 'Limpiar terminal negra e inspector de archivos', category: 'System' },
            { cmd: 'clear', desc: 'Limpiar buffer de la pestaña activa de Tabby', category: 'Terminal' },
            { cmd: 'profiles', desc: 'Abrir selector de perfiles de conexión de Tabby', category: 'Tabby' },
            { cmd: 'themes', desc: 'Selector visual de temas de Tabby Terminal', category: 'Tabby' },
            { cmd: 'palette', desc: 'Abrir paleta de comandos rápida (Ctrl+Shift+P)', category: 'Tabby' }
        ],

        init: function () {
            console.log('[TabbyTerminal] Initialized Tabby Terminal engine (MIT License - Eugeny Pankov & DIKTATCART / Hashcod).');
            this.initClock();
            this.loadSavedTheme();
            this.ensureDefaultTab();
            this.setupPromptAutocomplete();
            this.setupKeyboardShortcuts();
            this.renderTabs();
        },

        initClock: function () {
            const update = () => {
                const el = document.getElementById('tabbyLiveClock');
                if (el) {
                    const now = new Date();
                    const pad = (n) => String(n).padStart(2, '0');
                    el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                }
            };
            update();
            setInterval(update, 1000);
        },

        loadSavedTheme: function () {
            const saved = localStorage.getItem('tabby_theme') || 'default';
            this.applyTheme(saved);
        },

        applyTheme: function (themeId) {
            this.currentTheme = themeId;
            localStorage.setItem('tabby_theme', themeId);
            if (themeId === 'default') {
                document.body.removeAttribute('data-tabby-theme');
            } else {
                document.body.setAttribute('data-tabby-theme', themeId);
            }
            const badge = document.getElementById('tabbyThemeChipName');
            if (badge) {
                const found = this.themes.find(t => t.id === themeId);
                badge.textContent = found ? found.name : themeId;
            }
        },

        ensureDefaultTab: function () {
            if (this.tabs.length === 0) {
                this.tabs.push({
                    id: 'tab_default',
                    title: 'Hashcod Shell',
                    profileId: 'default',
                    entries: []
                });
                this.activeTabId = 'tab_default';
            }
        },

        setupKeyboardShortcuts: function () {
            window.addEventListener('keydown', (e) => {
                // Ctrl+Shift+P -> Open Command Palette
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
                    e.preventDefault();
                    this.openPaletteModal();
                }
                // Ctrl+T -> New Tab
                if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.addNewTab();
                    }
                }
                // Ctrl+W -> Close active tab
                if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.closeTab(this.activeTabId);
                    }
                }
                // Ctrl+L -> Clear active tab buffer
                if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.clearActiveTab();
                    }
                }
            });
        },

        setupPromptAutocomplete: function () {
            const input = document.getElementById('cmdInput');
            if (!input) return;

            let dropdown = document.getElementById('tabbyAutoDropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.id = 'tabbyAutoDropdown';
                dropdown.className = 'tabby-autocomplete-dropdown';
                const promptRow = document.querySelector('.block-row.block-prompt');
                if (promptRow) {
                    promptRow.style.position = 'relative';
                    promptRow.appendChild(dropdown);
                }
            }

            input.addEventListener('input', () => {
                const val = input.value.trim().toLowerCase();
                if (!val) {
                    dropdown.classList.remove('open');
                    return;
                }
                const matches = this.catalog.filter(item => 
                    item.cmd.toLowerCase().startsWith(val) || 
                    item.desc.toLowerCase().includes(val) ||
                    item.category.toLowerCase().includes(val)
                );
                if (matches.length === 0) {
                    dropdown.classList.remove('open');
                    return;
                }
                this.renderAutocompleteMatches(matches, dropdown, input);
            });

            input.addEventListener('keydown', (e) => {
                if (!dropdown.classList.contains('open')) return;
                const items = dropdown.querySelectorAll('.tabby-auto-item');
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.activeAutoIndex = (this.activeAutoIndex + 1) % items.length;
                    this.highlightAutoItem(items);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.activeAutoIndex = (this.activeAutoIndex - 1 + items.length) % items.length;
                    this.highlightAutoItem(items);
                } else if (e.key === 'Tab' || (e.key === 'Enter' && this.activeAutoIndex >= 0)) {
                    if (this.activeAutoIndex >= 0 && items[this.activeAutoIndex]) {
                        e.preventDefault();
                        const cmd = items[this.activeAutoIndex].getAttribute('data-cmd');
                        input.value = cmd;
                        dropdown.classList.remove('open');
                        this.activeAutoIndex = -1;
                        if (e.key === 'Enter') {
                            if (typeof window.submitCommand === 'function') window.submitCommand(cmd);
                        }
                    }
                } else if (e.key === 'Escape') {
                    dropdown.classList.remove('open');
                    this.activeAutoIndex = -1;
                }
            });

            document.addEventListener('click', (e) => {
                if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
                    dropdown.classList.remove('open');
                }
            });
        },

        highlightAutoItem: function (items) {
            items.forEach((it, idx) => {
                it.classList.toggle('selected', idx === this.activeAutoIndex);
                if (idx === this.activeAutoIndex) it.scrollIntoView({ block: 'nearest' });
            });
        },

        renderAutocompleteMatches: function (matches, dropdown, input) {
            this.activeAutoIndex = -1;
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            dropdown.innerHTML = matches.map(m => `
                <div class="tabby-auto-item" data-cmd="${esc(m.cmd)}" onclick="window.TabbyTerminal.selectAuto('${esc(m.cmd)}')">
                    <span class="tabby-auto-cmd">
                        <span>&gt;= ${esc(m.cmd)}</span>
                        <span class="tabby-badge">${esc(m.category)}</span>
                    </span>
                    <span style="font-size:11px; color:#888;">${esc(m.desc)}</span>
                </div>
            `).join('');
            dropdown.classList.add('open');
        },

        selectAuto: function (cmd) {
            const input = document.getElementById('cmdInput');
            const dropdown = document.getElementById('tabbyAutoDropdown');
            if (input) {
                input.value = cmd;
                input.focus();
            }
            if (dropdown) dropdown.classList.remove('open');
        },

        addNewTab: function (profileId, title) {
            const prof = this.profiles.find(p => p.id === (profileId || 'default')) || this.profiles[0];
            const newId = 'tab_' + Date.now();
            this.tabs.push({
                id: newId,
                title: title || prof.name,
                profileId: prof.id,
                entries: []
            });
            this.activeTabId = newId;
            this.renderTabs();
            if (prof.defaultCmd && profileId) {
                if (typeof window.submitCommand === 'function') {
                    window.submitCommand(prof.defaultCmd);
                }
            }
        },

        switchTab: function (tabId) {
            this.activeTabId = tabId;
            this.renderTabs();
        },

        closeTab: function (tabId) {
            if (this.tabs.length <= 1) {
                this.clearActiveTab();
                return;
            }
            this.tabs = this.tabs.filter(t => t.id !== tabId);
            if (this.activeTabId === tabId) {
                this.activeTabId = this.tabs[this.tabs.length - 1].id;
            }
            this.renderTabs();
        },

        clearActiveTab: function () {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            if (active) {
                active.entries = [];
                this.renderTabs();
            }
        },

        createBlock: function (cmd, outputHtml, meta) {
            return this.addEntryToActiveTab(cmd, outputHtml, meta);
        },

        renderSessionFeed: function () {
            return this.renderTabs();
        },

        startRunningEntry: function (cmd) {
            this.ensureDefaultTab();
            let active = this.tabs.find(t => t.id === this.activeTabId) || this.tabs[0];
            
            // Quitar cualquier entrada running previa
            active.entries = active.entries.filter(e => !e.isRunning);

            const entryId = 'entry_running_' + Date.now();
            active.entries.push({
                id: entryId,
                command: cmd,
                isRunning: true,
                outputHtml: `
                    <div style="display:flex; align-items:center; gap:8px; color:inherit; font-family:var(--tabby-font); font-size:12px; padding:6px 0;">
                        <svg style="animation: spin 0.7s linear infinite; width:15px; height:15px; fill:currentColor; flex-shrink:0;" viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8C6.25 13.93 6 12.99 6 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.45.87.7 1.81.7 2.8c0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
                        <span>Procesando comando…</span>
                    </div>
                `,
                duration: 'ejecutando…',
                isError: false,
                time: new Date().toLocaleTimeString()
            });

            this.renderTabs();
            setTimeout(() => {
                const log = document.querySelector('.tabby-session-log');
                if (log) log.scrollTop = log.scrollHeight;
            }, 30);
            return entryId;
        },

        addEntryToActiveTab: function (cmd, outputHtml, meta) {
            this.ensureDefaultTab();
            let active = this.tabs.find(t => t.id === this.activeTabId);
            if (!active) {
                active = this.tabs[0];
                this.activeTabId = active.id;
            }

            // Quitar cualquier entrada running si existe
            active.entries = active.entries.filter(e => !e.isRunning);

            const entryId = 'entry_' + Date.now();
            const dur = meta && meta.duration ? meta.duration + 'ms' : '1ms';
            const isError = !!(meta && (meta.isError || meta.error));

            active.entries.push({
                id: entryId,
                command: cmd,
                outputHtml: outputHtml,
                duration: dur,
                isError: isError,
                time: new Date().toLocaleTimeString()
            });

            if (active.entries.length > 50) {
                active.entries.shift();
            }

            this.renderTabs();

            setTimeout(() => {
                const log = document.querySelector('.tabby-session-log');
                if (log) log.scrollTop = log.scrollHeight;
            }, 30);
        },

        renderTabs: function () {
            const container = document.getElementById('executionContent');
            if (!container) return;

            this.ensureDefaultTab();
            const active = this.tabs.find(t => t.id === this.activeTabId) || this.tabs[0];
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

            const tabsHtml = this.tabs.map(t => {
                const isActive = (t.id === active.id) ? 'active' : '';
                return `
                    <div class="tabby-tab ${isActive}" onclick="window.TabbyTerminal.switchTab('${t.id}')">
                        <span class="tabby-tab-title">${esc(t.title)}</span>
                        <span class="tabby-tab-close" onclick="event.stopPropagation(); window.TabbyTerminal.closeTab('${t.id}')" title="Cerrar pestaña">&times;</span>
                    </div>
                `;
            }).join('');

            const entriesHtml = (active.entries.length === 0) 
                ? `<div style="text-align:center; padding:30px; color:#888888; font-size:12px;">Pestaña lista. Introduce un comando o abre un perfil de Tabby.</div>`
                : active.entries.map(e => `
                    <div class="tabby-entry" id="${e.id}">
                        <div class="tabby-entry-header">
                            <span class="tabby-entry-cmd">
                                <span style="color:#5294e2; font-weight:700;">&gt;=</span>
                                <span>${esc(e.command)}</span>
                            </span>
                            <div class="tabby-entry-toolbar">
                                <span style="color:#888; margin-right:6px;">⚡ ${esc(e.duration)} · ${esc(e.time)}</span>
                                <button type="button" class="tabby-mini-btn tabby-gateway-mini-btn gateway-action-btn" title="Gateway · Enviar salida de comando" onclick="window.TabbyTerminal.shareEntryGateway('${e.id}')">${TABBY_SVG_GATEWAY}</button>
                                <button type="button" class="tabby-mini-btn" title="Copiar comando" onclick="navigator.clipboard.writeText('${esc(e.command)}')">📋</button>
                                <button type="button" class="tabby-mini-btn" title="Re-ejecutar" onclick="if(typeof window.submitCommand==='function') window.submitCommand('${esc(e.command)}')">🔄</button>
                            </div>
                        </div>
                        <div class="tabby-entry-body">
                            ${e.outputHtml}
                        </div>
                    </div>
                `).join('');

            container.innerHTML = `
                <div class="tabby-terminal-container">
                    <div class="tabby-tab-bar">
                        ${tabsHtml}
                        <button type="button" class="tabby-add-tab-btn" onclick="window.TabbyTerminal.addNewTab()" title="Nueva pestaña (Ctrl+T)">
                            ${TABBY_SVG_PLUS}
                        </button>
                        <div class="tabby-tab-bar-actions">
                            <button type="button" class="tabby-action-btn tabby-gateway-btn gateway-action-btn" onclick="window.TabbyTerminal.shareActiveTabGateway()" title="Gateway · Transportar terminal y generar código único">
                                ${TABBY_SVG_GATEWAY} <span>Gateway</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.openProfilesModal()">
                                ${TABBY_SVG_PROFILE} <span>Perfiles</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.openThemesModal()">
                                ${TABBY_SVG_PALETTE} <span>Temas</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.openPaletteModal()">
                                ${TABBY_SVG_GEAR} <span>Paleta</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.exportActiveTabLog()">
                                ${TABBY_SVG_EXPORT} <span>Exportar</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.clearActiveTab()">
                                ${TABBY_SVG_TRASH} <span>Limpiar</span>
                            </button>
                        </div>
                    </div>
                    <div class="tabby-tab-content">
                        <div class="tabby-session-log">
                            ${entriesHtml}
                        </div>
                    </div>
                </div>
            `;
        },

        shareActiveTabGateway: function () {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            let text = '';
            if (active && active.entries.length > 0) {
                text += '# Tabby Terminal — Session (' + active.title + ')\n\n';
                active.entries.forEach((e, idx) => {
                    text += `### [${idx + 1}] >= ${e.command}\n`;
                    text += `*Timestamp: ${e.time} (${e.duration})*\n\n`;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = e.outputHtml;
                    text += '```\n' + (tempDiv.innerText || tempDiv.textContent) + '\n```\n\n';
                });
            } else {
                const editor = document.getElementById('functionEditor');
                text = editor ? String(editor.value || '').trim() : '';
            }
            if (typeof window.openGatewayFromTool === 'function') {
                window.openGatewayFromTool('terminal', {
                    name: (active ? active.title : 'terminal') + '.md',
                    content: text || '# Tabby Terminal Session\n\nTerminal activa de Hashcod codespace.',
                    autoSend: true
                });
            } else if (typeof window.openPlatformGateway === 'function') {
                window.openPlatformGateway();
            }
        },

        shareEntryGateway: function (entryId) {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            if (!active) return;
            const entry = active.entries.find(e => e.id === entryId);
            if (!entry) return;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = entry.outputHtml;
            const rawOut = tempDiv.innerText || tempDiv.textContent;
            const content = `# Comando: ${entry.command}\n# Ejecutado: ${entry.time} (${entry.duration})\n\n${rawOut}`;
            const cleanCmd = String(entry.command || 'cmd').replace(/[^\w.-]+/g, '_').slice(0, 30);
            if (typeof window.openGatewayFromTool === 'function') {
                window.openGatewayFromTool('terminal', {
                    name: 'tabby-' + cleanCmd + '.txt',
                    content: content,
                    autoSend: true
                });
            } else if (typeof window.openPlatformGateway === 'function') {
                window.openPlatformGateway();
            }
        },

        exportActiveTabLog: function () {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            if (!active || active.entries.length === 0) {
                alert('No hay comandos en la pestaña activa para exportar.');
                return;
            }
            let text = '# Tabby Terminal — Session Log (' + active.title + ')\n';
            text += '# Exported: ' + new Date().toISOString() + '\n\n';
            active.entries.forEach((e, idx) => {
                text += `## [${idx + 1}] ${e.time} (${e.duration})\n`;
                text += `> ${e.command}\n\n`;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = e.outputHtml;
                text += (tempDiv.innerText || tempDiv.textContent) + '\n\n';
                text += '--------------------------------------------------------\n\n';
            });
            const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tabby-terminal-' + active.id + '.md';
            a.click();
            URL.revokeObjectURL(url);
        },

        openProfilesModal: function () {
            const existing = document.getElementById('tabbyProfilesModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'tabbyProfilesModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_PROFILE} <span>Perfiles de Conexión y Sesión Tabby</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyProfilesModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <p style="margin-top:0; color:#888; font-size:12px;">Selecciona un perfil para abrir una nueva pestaña dedicada en Hashcod:</p>
                        ${this.profiles.map(p => `
                            <div class="tabby-profile-card" onclick="window.TabbyTerminal.selectProfile('${esc(p.id)}')">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-size:20px;">${p.icon}</span>
                                    <div>
                                        <div style="font-weight:700; color:#ffffff; font-size:13px;">${esc(p.name)}</div>
                                        <div style="font-size:11px; color:#888888; margin-top:2px;">${esc(p.desc)}</div>
                                    </div>
                                </div>
                                <span class="tabby-badge">&gt;= ${esc(p.defaultCmd)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Tabby Profiles Engine (MIT License)</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyProfilesModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        },

        selectProfile: function (profileId) {
            const modal = document.getElementById('tabbyProfilesModal');
            if (modal) modal.remove();
            this.addNewTab(profileId);
        },

        openThemesModal: function () {
            const existing = document.getElementById('tabbyThemesModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'tabbyThemesModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_PALETTE} <span>Temas de Tabby Terminal</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyThemesModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <p style="margin-top:0; color:#888; font-size:12px;">Personaliza la apariencia de las pestañas y la consola:</p>
                        <div class="tabby-themes-grid">
                            ${this.themes.map(t => `
                                <div class="tabby-theme-card ${t.id === this.currentTheme ? 'active' : ''}" onclick="window.TabbyTerminal.applyTheme('${t.id}')">
                                    <div class="tabby-theme-strip" style="background:${t.bg}; border:1px solid rgba(255,255,255,0.1);">
                                        <div style="flex:1; background:${t.bg};"></div>
                                        <div style="width:20px; background:${t.accent};"></div>
                                        <div style="width:20px; background:${t.fg};"></div>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <strong style="font-size:12px; color:#ffffff;">${esc(t.name)}</strong>
                                        ${t.id === this.currentTheme ? '<span style="color:#a3be8c; font-size:11px; font-weight:700;">Activo</span>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Tabby Theme Selector</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyThemesModal').remove()">Listo</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        },

        openPaletteModal: function () {
            const existing = document.getElementById('tabbyPaletteModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'tabbyPaletteModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_GEAR} <span>Paleta de Comandos Tabby (Ctrl+Shift+P)</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyPaletteModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <input type="text" id="tabbyPaletteSearch" class="cmd-input" placeholder="Buscar comando o acción rápida..." style="margin-bottom:12px; width:100%;" oninput="window.TabbyTerminal.filterPalette(this.value)">
                        <div id="tabbyPaletteList">
                            ${this.catalog.map(c => `
                                <div class="tabby-profile-card" onclick="window.TabbyTerminal.executePaletteCmd('${esc(c.cmd)}')">
                                    <div>
                                        <div style="font-weight:700; color:#ffffff; font-size:13px;">${esc(c.cmd)} <span class="tabby-badge">${esc(c.category)}</span></div>
                                        <div style="font-size:11px; color:#888888; margin-top:2px;">${esc(c.desc)}</div>
                                    </div>
                                    <span class="tabby-badge">Ejecutar</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Tabby Command Palette</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyPaletteModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);

            setTimeout(() => {
                const inp = document.getElementById('tabbyPaletteSearch');
                if (inp) inp.focus();
            }, 100);
        },

        filterPalette: function (query) {
            const container = document.getElementById('tabbyPaletteList');
            if (!container) return;
            const q = query.toLowerCase().trim();
            const filtered = this.catalog.filter(c => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            container.innerHTML = filtered.map(c => `
                <div class="tabby-profile-card" onclick="window.TabbyTerminal.executePaletteCmd('${esc(c.cmd)}')">
                    <div>
                        <div style="font-weight:700; color:#ffffff; font-size:13px;">${esc(c.cmd)} <span class="tabby-badge">${esc(c.category)}</span></div>
                        <div style="font-size:11px; color:#888888; margin-top:2px;">${esc(c.desc)}</div>
                    </div>
                    <span class="tabby-badge">Ejecutar</span>
                </div>
            `).join('');
        },

        executePaletteCmd: function (cmd) {
            const modal = document.getElementById('tabbyPaletteModal');
            if (modal) modal.remove();
            const input = document.getElementById('cmdInput');
            if (input) input.value = cmd;
            if (typeof window.submitCommand === 'function') {
                window.submitCommand(cmd);
            }
        },

        openSourceNotice: function () {
            const existing = document.getElementById('tabbyNoticeModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'tabbyNoticeModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_TERMINAL} <span>Tabby Terminal Integration Notice (MIT License)</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyNoticeModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <p><strong>Tabby Terminal Integration (MIT License):</strong></p>
                        <ul>
                            <li><strong>Upstream Project:</strong> <a href="https://github.com/Eugeny/tabby" target="_blank" style="color:#5294e2;">Eugeny/tabby</a></li>
                            <li><strong>Author:</strong> Copyright (c) 2017 Eugeny Pankov</li>
                            <li><strong>Platform Adaptation:</strong> Copyright (c) 2026 DIKTATCART / Hashcod</li>
                            <li><strong>License:</strong> MIT Permissive Open Source License.</li>
                        </ul>
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Licensed under MIT</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyNoticeModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        }
    };

    window.TabbyTerminal = TabbyTerminal;
    document.addEventListener('DOMContentLoaded', () => {
        TabbyTerminal.init();
    });
})(window, document);