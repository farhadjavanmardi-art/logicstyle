/* ══════════════════════════════════════════
   ls-prompts.js — Logic Style · Shared Prompts
   Requires: ls-data.js loaded first (_selectedColor used inside buildHairPrompt)
══════════════════════════════════════════ */

const IDENTITY_RULES = `ABSOLUTE IDENTITY PRESERVATION — NON-NEGOTIABLE:
- Preserve the client's identity with 100% fidelity: exact face shape, facial features, bone structure, skin tone, ethnicity, age, gender presentation, expression, and natural skin texture
- Preserve the original camera angle, lens perspective, crop, head position, shoulders, background, clothing, lighting direction, shadow quality, and ambient mood
- Preserve the original face proportions, hairline placement, forehead proportion, ears, neck, jaw, nose, eyes, lips, eyebrows, beard stubble, and all non-service areas
- Do NOT beautify, retouch, slim, reshape, age, de-age, stylize, smooth skin, change eye color, change skin tone, change ethnicity, or add glamour lighting
- Do NOT add watermarks, text, logos, captions, graphic overlays, extra accessories, or fashion-editorial effects
- Output must look like a real premium salon consultation preview made from the uploaded client photo, not a beauty campaign, AI portrait, stock photo, or influencer makeover
- For back views, do not invent a face; for side views, do not rotate the client into a new pose; for partial views, modify only what is visible and service-relevant`;

const HAIR_QUALITY_RULES = `HAIR / BEARD / COLOR QUALITY EXECUTION RULES:
- Keep the result grounded in realistic salon and barbershop consultation quality, not editorial beauty photography
- Respect real hair physics: density, growth direction, scalp connection, root behavior, strand weight, layering, curl shrinkage, taper transitions, and natural fall pattern
- Make all cuts technically achievable: believable perimeter, face framing, graduation, layering, fade/taper blend, neckline, crown behavior, and profile silhouette
- Keep hair and beard texture connected naturally to the client's visible hairline, beard line, scalp, sideburns, and neckline; avoid wig-like edges or painted-on facial hair
- Color work must show professional placement, tonal depth, root softness, dimension, realistic brightness distribution, and natural light interaction
- Blonde work must keep believable lift levels; brunette work must keep depth and reflection; grey work must look age-appropriate and dimensional; fashion color must remain salon-realistic unless explicitly bold
- Treatment work must improve shine, smoothness, hydration, fiber quality, frizz control, curl definition, or volume realistically without changing identity, haircut, or face
- Perm and curl services must create believable salon-shaped movement suitable for hair length, density, gender category, and visible texture
- For side and back views, prioritize silhouette accuracy, visible placement, back-panel realism, crown flow, neckline, and perimeter shape
- Avoid fake shine, plastic hair, over-smoothed skin, fake density, harsh stripes, floating hair sections, cartoon contrast, unrealistic symmetry, and artificial beauty-filter results
- Fade precision: when a spec describes a specific fade height (low/mid/high) or guard progression, execute that graduation with technical accuracy — the fade height placement, skin zone width, and transition band must be visually readable and match the described specification`;

const FACE_IDENTITY_RULES = `ABSOLUTE IDENTITY PRESERVATION — NON-NEGOTIABLE:
- Preserve the person's face with 100% fidelity: exact face shape, bone structure, skin tone, ethnicity, age, gender, and expression
- Preserve the HAIR exactly as it is — do NOT change hair color, length, style, texture, or any hair characteristic
- Preserve the exact lighting direction, shadow quality, and ambient mood
- Preserve the background, clothing, and all non-treatment areas with pixel-level accuracy
- Preserve the exact camera angle, focal length, and depth of field
- Do NOT add any watermarks, text, logos, or graphic overlays
- Do NOT apply beauty filters, skin smoothing beyond the treatment area, or HDR enhancement
- Do NOT change the apparent age globally — only the specific treatment area should change
- Do NOT alter eyebrows, eyelashes, or eye color unless the treatment specifically involves that area
- Output must look like an authentic professional clinic consultation before/after photo`;

const FACE_QUALITY_RULES = `FACIAL AESTHETICS EXECUTION RULES:
- The result must look like a real premium clinic consultation photo — not a beauty campaign, not a fashion editorial
- All changes must be anatomically plausible and technically achievable by the stated procedure
- Maintain complete facial symmetry balance — asymmetric corrections should look natural, not overcorrected
- Preserve the natural fat compartment distribution in areas NOT being treated
- Show realistic tissue response: soft tissue drape, skin tension, shadow pattern
- Do not invent unnatural glow, fake skin blur, or CGI plastic texture
- Filler results must show appropriate soft tissue projection with natural volume distribution
- Botox results must show realistic muscle relaxation without frozen or artificial appearance
- Lifting results must show believable tissue repositioning with natural skin drape
- Skin treatments must show realistic improvement without unnatural perfection
- The treated area must integrate seamlessly with adjacent untreated areas`;



const DENSITY_PRESERVATION_RULES = `DENSITY / VOLUME PRESERVATION — CRITICAL:
- Preserve the client's original visible hair density, beard density, hairline density, crown density, temple density, and scalp/skin visibility
- Do not invent extra hair volume, do not fill bald spots, do not lower a receding hairline, do not thicken sparse temples, and do not hide thinning areas unrealistically
- Style the existing hair better, but do not create transplant-like density or a wig-like result
- If the client has fine, thin, sparse, patchy, receding, or low-density hair/beard, execute the selected style within that same realistic limitation
- Keep root direction, growth pattern, grey concentration, patchiness, density variation, and skin/scalp visibility believable
- The simulation must be honest enough for a real salon/barbershop consultation, not a fantasy makeover`;

const BEARD_LENGTH_CONVERSION_SAFETY = `BEARD LENGTH CONVERSION SAFETY — NON-NEGOTIABLE:
- First respect the client's current visible beard length and beard mass
- If the client already has a medium or long beard, do NOT convert it into stubble, clean shave, or very short beard unless the selected modifier explicitly says “Bart kürzen / Trim Down”
- Do not erase beard mass accidentally; do not reveal or invent hidden jaw/chin structure under a long beard
- If the selected style is shorter than the current beard and trim-down is not selected, shape the existing beard instead of removing it
- For clean-shaven or low-beard clients, add beard only as a controlled preview and keep density realistic unless “Style Preview” is explicitly selected
- Preserve facial identity, jaw proportions, skin texture, lips, nose, eyes, eyebrows, and all non-beard areas exactly`;

const FINAL_IDENTITY_LOCK = `FINAL IDENTITY LOCK — HIGHEST PRIORITY:
- Change ONLY the selected hair, beard, or color service area
- Do not change the face, apparent age, skin texture, expression, eye area, eyebrows, nose, lips, jawline, cheeks, ears, neck, or body proportions
- Do not make the person look older, younger, slimmer, more glamorous, more retouched, or like a different person
- Preserve the original photo realism, lighting, framing, and personal character exactly`;

function normalizeModifierText(modifierText){
 return String(modifierText||'').trim();
}

function buildHairPrompt(spec, hairType, view, modifierText='') {
 const viewInstructions = {
  'FRONT VIEW':
   'Camera faces the client directly. Preserve exact front framing, face proportions, expression, hairline position, forehead contour, temples, shoulders, and lighting. Apply only what is visible from the front.',
  'LEFT SIDE PROFILE':
   'Camera is exactly 90 degrees to the left. Preserve the left profile, ear placement, sideburn alignment, neckline silhouette, head angle, and natural profile depth. Do not invent a frontal face.',
  'RIGHT SIDE PROFILE':
   'Camera is exactly 90 degrees to the right. Preserve the right profile, ear placement, sideburn alignment, neckline silhouette, head angle, and natural profile depth. Do not invent a frontal face.',
  'BACK VIEW':
   'Camera shows the back of the head only. Preserve the back-head proportions, crown position, neckline, neck, shoulders, posture, lighting, and natural fall pattern. Face must remain invisible.',
  '45 DEGREE LEFT VIEW':
   'Camera is at a 45-degree left view. Preserve the original diagonal angle, visible cheek contour, temple, sideburn, ear area, depth, and profile balance. Do not rotate the client or invent a new pose.',
  '45 DEGREE RIGHT VIEW':
   'Camera is at a 45-degree right view. Preserve the original diagonal angle, visible cheek contour, temple, sideburn, ear area, depth, and profile balance. Do not rotate the client or invent a new pose.',
  'FRONT 45 RIGHT VIEW':
   'Camera is positioned 45 degrees to the front-right. Preserve natural front-right facial framing, forehead contour, temple area, and visible depth.',
  'FRONT 45 LEFT VIEW':
   'Camera is positioned 45 degrees to the front-left. Preserve natural front-left facial framing, forehead contour, temple area, and visible depth.',
  'BACK 45 RIGHT VIEW':
   'Camera is positioned 45 degrees to the back-right. Show the rear-right shape, occipital area, crown flow, neckline, and silhouette clearly.',
  'BACK 45 LEFT VIEW':
   'Camera is positioned 45 degrees to the back-left. Show the rear-left shape, occipital area, crown flow, neckline, and silhouette clearly.',
 };
 const viewNote = viewInstructions[view] || `Photo perspective: ${view}`;
 const modifierBlock = normalizeModifierText(modifierText) ? `\nADVANCED CLIENT / BARBER / SALON SETTINGS:\n${normalizeModifierText(modifierText)}\n` : '';
 const isBeard = hairType === 'beard and facial hair';
 const subjectArea = isBeard ? 'beard and facial hair' : 'hair on the head';
 const specialistRole = isBeard
  ? 'senior beard specialist, master barber, and realistic grooming visualization artist'
  : 'senior women\'s hairstylist, senior men\'s hairstylist, master barber, salon consultant, and realistic hair visualization artist';
 const serviceRules = isBeard
  ? `BEARD EXECUTION RULES:
- Modify ONLY the beard, mustache, sideburns, and cheek/neck/jawline beard boundaries
- Fade execution: if the spec describes a fade, show the precise graduation — skin at the base, clearly stepping through guard levels into full density. The graduation zone width and fade height must match the spec description exactly
- Length execution: render the specified mm-length range realistically — 1–2mm reads as early stubble with visible skin through it; 4–6mm reads as heavy stubble with full coverage; 10–15mm reads as a short beard; 25–40mm reads as a substantial full beard
- Line definition: if the spec describes sharp or razor-defined lines, show clean, precise, deliberate edges. If the spec describes natural lines, show the natural growth arc without geometric definition
- Density and growth direction: respect the client's visible growth pattern, natural density distribution, grey concentration, and skin tone. Do not artificially fill in sparse zones or remove natural variation
- Keep all facial features, skin, eyes, nose, lips, chin structure, jaw shape, and non-beard areas completely unchanged
- Do NOT add beard where the client has none — respect actual visible growth density limits
- Distinguish stubble lengths precisely: 0.5–1mm must read as shadow, 1–2mm as light stubble, 2–3mm as designer stubble, 4–6mm as heavy stubble, 8–12mm as short beard, 20–35mm as medium beard, 35mm+ as long beard
- Keep beard shape readable: rounded, square, angular, pointed, ducktail, Garibaldi, Bandholz, Viking, goatee, Balbo, Van Dyke, or beardstache must not collapse into the same generic full beard`
  : `HAIRCUT / STYLING EXECUTION RULES:
- Modify only haircut structure, length impression, silhouette, perimeter, layering, fringe, face framing, parting behavior, volume distribution, styling finish, and natural texture
- Keep the exact original hair color, tonal family, and root behavior unless a color service is also explicitly selected
- Make the result technically salon-achievable and commercially wearable for a real client consultation
- Avoid wig-like volume, floating sections, fake symmetry, plastic texture, unrealistic density, or fashion-photo retouching`;

 if (_selectedColor) {
  const colorClean = _selectedColor.replace('COLOR:', '').trim();
  return `You are a ${specialistRole} creating a premium realistic salon consultation preview for Google Nano Banana 2.

TASK:
Apply the selected transformation to the ${subjectArea} while also applying the selected color. Edit ONLY the service-relevant hair or beard area.

SELECTED MODEL / STYLE SPECIFICATION:
${spec}

COLOR TO APPLY:
${colorClean}

PHOTO ANGLE / VIEW CONTROL:
${viewNote}

${IDENTITY_RULES}

${HAIR_QUALITY_RULES}

${DENSITY_PRESERVATION_RULES}
${isBeard ? BEARD_LENGTH_CONVERSION_SAFETY : ''}
${modifierBlock}
${serviceRules}

${FINAL_IDENTITY_LOCK}

COLOR INTEGRATION RULES:
- Blend the color with realistic salon dimension, soft root behavior, tonal variation, and believable light reflection
- Keep the color placement connected to the selected cut or beard shape without changing the client's face or camera angle
- Avoid flat overlays, fantasy saturation unless requested, fake shine, and color bleeding onto skin or background

OUTPUT:
One photorealistic premium salon consultation result with authentic everyday camera realism.`;
 }

 return `You are a ${specialistRole} creating a premium realistic salon consultation preview for Google Nano Banana 2.

TASK:
Apply the selected transformation to the ${subjectArea}. Edit ONLY the service-relevant hair or beard area.

SELECTED MODEL / STYLE SPECIFICATION:
${spec}

PHOTO ANGLE / VIEW CONTROL:
${viewNote}

${IDENTITY_RULES}

${HAIR_QUALITY_RULES}

${DENSITY_PRESERVATION_RULES}
${isBeard ? BEARD_LENGTH_CONVERSION_SAFETY : ''}
${modifierBlock}
${serviceRules}

${FINAL_IDENTITY_LOCK}

OUTPUT:
One photorealistic premium salon consultation result with authentic everyday camera realism.`;
}

function buildColorPrompt(service, hairType, view, modifierText='') {
 const isColor = service.startsWith('COLOR:');
 const isTech = service.startsWith('TECH:');
 const clean = service.replace(/^(COLOR:|TECH:)/, '').trim();
 const isBartColor = service.includes('beard hair only');
 const isTreatment = /treatment|repair|keratin|smoothing|frizz|gloss care|scalp|moisture|hydration|bond|extension|perm|curl|wave|volume|thickening|Brazilian|straightening|texture/i.test(clean);
 const targetArea = isBartColor ? 'beard and facial hair only' : hairType;

 const viewInstructions = {
  'FRONT VIEW':
   'Camera faces the client directly. Show the service exactly as visible from the front: face-framing pieces, root area, fringe area, beard front, tone around the face, and natural shine. Preserve the original pose.',
  'LEFT SIDE PROFILE':
   'Camera is exactly 90 degrees left. Show placement, blend, gradient, curl pattern, smoothing, beard contour, or treatment finish only from the visible left side. Do not invent a frontal face.',
  'RIGHT SIDE PROFILE':
   'Camera is exactly 90 degrees right. Show placement, blend, gradient, curl pattern, smoothing, beard contour, or treatment finish only from the visible right side. Do not invent a frontal face.',
  'BACK VIEW':
   'Camera shows the back of the head only. Prioritize back-panel placement, root melt, gradient, end saturation, curl or wave pattern, smoothing, density, shine, neckline, and length blend. Do not generate a face.',
  '45 DEGREE LEFT VIEW':
   'Camera is at a 45-degree left view. Preserve the diagonal angle and show realistic service visibility through the left-front or left-side area without rotating the client.',
  '45 DEGREE RIGHT VIEW':
   'Camera is at a 45-degree right view. Preserve the diagonal angle and show realistic service visibility through the right-front or right-side area without rotating the client.',
  'FRONT 45 RIGHT VIEW':
   'Camera is 45 degrees from the front-right. Show realistic placement, brightness, dimension, and service visibility from that angle.',
  'FRONT 45 LEFT VIEW':
   'Camera is 45 degrees from the front-left. Show realistic placement, brightness, dimension, and service visibility from that angle.',
  'BACK 45 RIGHT VIEW':
   'Camera is 45 degrees from the back-right. Show realistic placement, blend, tonal depth, texture, and finish from that angle.',
  'BACK 45 LEFT VIEW':
   'Camera is 45 degrees from the back-left. Show realistic placement, blend, tonal depth, texture, and finish from that angle.',
 };
 const viewNote = viewInstructions[view] || `Photo perspective: ${view}`;
 const modifierBlock = normalizeModifierText(modifierText) ? `\nADVANCED CLIENT / BARBER / SALON SETTINGS:\n${normalizeModifierText(modifierText)}\n` : '';

 const colorBlock = isColor
  ? `PROFESSIONAL COLOR SERVICE TO APPLY:
${clean}
- Keep the existing haircut, hair length, parting, perimeter, density behavior, and silhouette unchanged
- Show realistic root behavior, tonal direction, depth, reflect, shine, and salon dimension
- Make coverage, grey blending, brunette depth, blonde lift, fashion tone, or beard color look premium, modern, and consultation-ready`
  : '';
 const techBlock = isTech
  ? `PROFESSIONAL TECHNIQUE / TREATMENT SERVICE TO APPLY:
${clean}
- Keep the existing haircut, hair length, parting, perimeter, and silhouette unchanged unless the selected perm, curl, wave, extension, or volume service explicitly requires a texture or density finish change
- Execute the service like a real premium salon result with believable placement, blend, tone, texture, curl pattern, smoothing, repair, volume, or beard finish
- Treatment results must improve finish realistically; color techniques must show professional dimensional placement; perm services must create salon-achievable movement`
  : '';
 const categoryRules = isTreatment
  ? `TREATMENT / PERM REALISM RULES:
- Smoothing and keratin services reduce frizz and improve alignment without making hair plastic or flat
- Repair and moisture services improve fiber quality, softness, shine, and cuticle smoothness without changing the haircut
- Scalp services show subtle freshness and root lightness only, not a dramatic makeover
- Curl definition services enhance existing or selected curl pattern with hydration, separation, bounce, and controlled frizz
- Perm services must create realistic wave or curl patterns appropriate to hair length, density, gender category, and view angle
- Extensions must blend naturally in color, texture, length, density, and attachment invisibility`
  : `COLOR PLACEMENT REALISM RULES:
- Balayage must be hand-painted, soft, dimensional, and naturally blended through mid-lengths and ends
- Ombré must show a controlled gradient from darker root area to lighter ends; sombré must be softer and more subtle
- Babylights must be fine, delicate, diffused, and natural; highlights and lowlights must avoid harsh stripes
- Money piece must brighten the face frame with the selected intensity; root shadow and root melt must blend root depth smoothly
- Respect selected color intensity, brightness/lift, highlight density, tonal direction, placement, and root behavior exactly; subtle, medium, and bold results must be visibly different without becoming fake
- Glossing and toning must refine tone, richness, shine, brassiness, warmth, coolness, or reflect without fake overlays
- Grey blending and grey coverage must remain natural, age-appropriate, and dimensional
- Men's color and beard color must look subtle, realistic, density-aware, and skin-tone compatible`;

 return `You are a senior salon colorist, treatment specialist, curl/perming specialist, beard colorist, and realistic consultation visualization artist for Google Nano Banana 2.

TASK:
Apply the selected professional color, technical, treatment, perm, curl, smoothing, extension, or beard color service to the ${targetArea}.

CRITICAL CONSTRAINT:
Keep the exact identity, face, camera angle, background, clothing, skin, eyes, and non-service areas unchanged. Keep the haircut shape unchanged unless the selected treatment/perm/extension service requires a realistic texture or length/volume finish.

${colorBlock}${techBlock}

PHOTO ANGLE / VIEW CONTROL:
${viewNote}

${IDENTITY_RULES}

${HAIR_QUALITY_RULES}

${DENSITY_PRESERVATION_RULES}
${isBartColor ? BEARD_LENGTH_CONVERSION_SAFETY : ''}
${normalizeModifierText(modifierText) ? `ADVANCED CLIENT / SALON SETTINGS:
${normalizeModifierText(modifierText)}
` : ''}
${categoryRules}

${FINAL_IDENTITY_LOCK}

SERVICE REALISM RULES:
- The result must look like a real premium salon consultation photo, not a beauty campaign or AI makeover
- Show realistic tonal dimension, brightness distribution, root softness, reflect direction, texture behavior, and natural light interaction
- Avoid oversaturation, flat single-color overlays, fake highlights, cartoon contrast, plastic shine, changed skin tone, over-retouched skin, and unrealistic hair density

OUTPUT:
One photorealistic premium salon consultation result with authentic everyday camera realism.`;
}
