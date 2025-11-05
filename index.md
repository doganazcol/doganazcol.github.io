---
layout: page
---

<!-- Inline styles for the hero layout -->
<style>
  .hero {
    display: grid;
    grid-template-columns: 1fr 260px; /* text | photo */
    gap: 2rem;
    align-items: start;               /* top-align both columns */
    margin-top: 2rem;
  }
  .hero .portrait {
    width: 260px;
    height: 260px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 6px 16px rgba(0,0,0,.15);
  }
  @media (max-width: 820px) {
    .hero {
      grid-template-columns: 1fr;     /* stack on mobile */
    }
    .hero .portrait {
      justify-self: center;           /* center photo when stacked */
      margin-top: .5rem;
    }
  }
</style>

<div class="hero">
  <!-- LEFT: text -->
  <div>
    <h1 style="text-transform: lowercase; margin-bottom: 0.5em;">naz col</h1>

    <p>Hi! I’m Naz — a 4th year undergraduate at UC Berkeley and an AI/ML Researcher at the 
      <a href="https://bair.berkeley.edu/" target="_blank">Berkeley Artificial Intelligence Research (BAIR)</a>, 
      advised by <a href="https://people.eecs.berkeley.edu/~trevor/" target="_blank">Trevor Darrell</a> and 
      <a href="https://joeygonzalez.com/" target="_blank">Joey Gonzalez</a> in the 
      <a href="https://sky.cs.berkeley.edu/" target="_blank">Sky Computing Lab (SkyLab)</a>. 
      I’m interested in large language model behaviour and characteristics, as well as optimizing machine-learning systems for specific domains.</p>

    <p>Previously, I was part of the <strong>Web Defense, Knowledge & AI</strong> team under <a href="https://www.microsoft.com/en-us/security">Microsoft Security</a>, 
      where I worked on building, optimizing, and deploying <strong>Graph Neural Networks (GNNs)</strong> — 
      along with our side-project of restoring our cubicle with string lights from arcade machines ✨.</p>

      <p>At Berkeley, I am a senior member of  <a href="https://ml.studentorg.berkeley.edu/"> Machine Learning at Berkeley</a> where we collaborate accross research labs and leading industry companies.</p>

    <p>Find me on <a href="https://github.com/doganazcol">GitHub</a> or 
      <a href="mailto:doganazcol@berkeley.edu">email</a>.</p>
  </div>

  <!-- RIGHT: photo -->
  <div>
    <img class="portrait" src="/assets/IMG_0425.JPG" alt="Naz Col portrait">
  </div>
</div>

<!-- Everything below runs full-width again (normal flow) -->
<h2 style="text-transform: lowercase; margin: 2rem 0 .5rem;">research 🤖</h2>

<ul>
  <li>
    Building a novel <strong>prompt-based framework</strong> that enables LLM models to disguise each other's distinctive behavioral patterns without fine-tuning. 
    <a href="https://github.com/lisadunlap/dementor" target="_blank">[Dementor]</a>
  </li>
  <li>
    Extending an automated system to <strong>quantify qualitative differences in LLMs</strong>, developing algorithms to systematically analyse and compare their behaviours and responses. 
    <a href="https://github.com/lisadunlap/VibeCheck" target="_blank">[VibeCheck]</a>
  </li>
  <li>
    <strong>Building Project AEI: Emotional Intuition</strong> — research centered on emotional intelligence in conversational AI systems, focusing on modeling human affective patterns and empathy-driven responses with 
    <strong>NVIDIA Inception company KOER AI</strong>.
  </li>
  <li>
    Worked in the AI team of <strong>Professor Dan Garcia’s research group</strong> at UC Berkeley, focusing on combinatorial and computational game theory. 
    <strong>Trained neural networks</strong> for generating graphical and parameterizable game applications and <strong>developed algorithms</strong> to compress databases.
  </li>
</ul>
