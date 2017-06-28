# PhenoLines: Phenotype Comparison Visualizations for Disease Subtyping via Topic Models
Research prototype to visualize the temporal evolution of phenotypes in diseases described by topic models, based on the Human Phenotype Ontology.

This project is currently under development. The source code provided here should be considered alpha-code for proof of concept and for reference purposes. A documented and modularized re-write is underway and will be posted here when it is available.

* For information, resources, and an online demo of the tool, please visit [www.phenolines.org](http://www.phenolines.org).

* PhenoLines uses the [Human Phenotype Ontology](http://www.human-phenotype-ontology.org) to structure data for visualization.


## Publication
**PhenoLines: Phenotype Comparison Visualizations for Disease Subtyping via Topic Models**  
Michael Glueck, Mahdi Pakdaman Naeini, Finale Doshi-Velez, Fanny Chevalier, Azam Khan, Daniel Wigdor, Michael Brudno
*In Submission*, 2017

PhenoLines is a visual analysis tool for the interpretation of disease subtypes, derived from the application of topic models
to clinical data. Topic models enable one to mine cross-sectional patient comorbidity data (e.g., electronic health records) and construct
disease subtypes—each with its own temporally evolving prevalence and co-occurrence of phenotypes—without requiring aligned
longitudinal phenotype data for all patients. However, the dimensionality of topic models makes interpretation challenging, and de
facto analyses provide little intuition regarding phenotype relevance or phenotype interrelationships. PhenoLines enables one to
compare phenotype prevalence within and across disease subtype topics, thus supporting subtype characterization, a task that involves
identifying a proposed subtype’s dominant phenotypes, ages of effect, and clinical validity. We contribute a data transformation workflow
that employs the Human Phenotype Ontology to hierarchically organize phenotypes and aggregate the evolving probabilities produced
by topic models. We introduce a novel measure of phenotype relevance that can be used to simplify the resulting topology. The design
of PhenoLines was motivated by formative interviews with machine learning and clinical experts. We describe the co-operative design
process, distill high-level tasks, and report on initial evaluations with machine learning experts and a medical domain expert. These
results suggest that PhenoLines demonstrates promising approaches to support the characterization and optimization of topic models.
