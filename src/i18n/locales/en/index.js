import ui from './ui.js'
import content from './content.js'
import mat from './materials.js'

// The Course Materials texts (./materials.js) add `nav.materials` and the `materials` section.
export default { ...ui, nav: { ...ui.nav, ...mat.nav }, materials: mat.materials, content }
