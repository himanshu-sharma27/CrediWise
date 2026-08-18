# CrediWiseAI — Model Comparison & Selection Report

> **Target:** `loan_approved` (`1` = Approved, `0` = Rejected)  
> **Evaluated Architectures:** Logistic Regression, Decision Tree, Random Forest, Gradient Boosting  
> **Champion Model:** `Random Forest` (`loan-model-v2.1-synthetic-10000`)  
> **Artifact Path:** `ml/models/loan_model_v2.joblib`

---

## 1. Candidate Model Configurations

All models were evaluated using identical 80/20 stratified train/test partitions ($N_{\text{train}} = 7,997$, $N_{\text{test}} = 2,000$) on the augmented dataset with preprocessing (`StandardScaler` + `OneHotEncoder`) fitted strictly on training folds inside a `Pipeline`.

| Model Name | Hyperparameters & Configuration | Purpose / Role |
| :--- | :--- | :--- |
| **Logistic Regression** | `max_iter=2000`, `random_state=42` | Linear interpretable baseline |
| **Decision Tree** | `max_depth=5`, `random_state=42` | Non-linear tree baseline |
| **Random Forest** | `n_estimators=200`, `max_depth=8`, `random_state=42` | **Selected Champion Ensemble** |
| **Gradient Boosting** | `n_estimators=150`, `learning_rate=0.05`, `max_depth=3`, `random_state=42` | Candidate sequential boosting ensemble |

---

## 2. 5-Fold Stratified Cross-Validation Results

Cross-validation was conducted across 5 stratified folds on the training split ($N=7,997$):

| Candidate Model | Accuracy ($\mu \pm \sigma$) | Precision ($\mu \pm \sigma$) | Recall ($\mu \pm \sigma$) | F1-Score ($\mu \pm \sigma$) [Primary] | ROC-AUC ($\mu \pm \sigma$) [Tie-Breaker] |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | $0.9167 \pm 0.0093$ | $0.9283 \pm 0.0039$ | $0.9387 \pm 0.0126$ | $0.9335 \pm 0.0078$ | $0.9472 \pm 0.0064$ |
| **Decision Tree** | $0.9494 \pm 0.0055$ | $0.9522 \pm 0.0028$ | $0.9673 \pm 0.0095$ | $0.9596 \pm 0.0046$ | $0.9581 \pm 0.0058$ |
| **Random Forest** *(Champion)* | $\mathbf{0.9527 \pm 0.0037}$ | $0.9524 \pm 0.0044$ | $\mathbf{0.9727 \pm 0.0057}$ | $\mathbf{0.9624 \pm 0.0030}$ | $0.9656 \pm 0.0043$ |
| **Gradient Boosting** *(Candidate)* | $0.9520 \pm 0.0037$ | $\mathbf{0.9533 \pm 0.0037}$ | $0.9705 \pm 0.0066$ | $0.9618 \pm 0.0030$ | $\mathbf{0.9673 \pm 0.0036}$ |

*Random Forest achieved the highest Cross-Validation F1 score ($0.9624$), which serves as the primary model selection criterion.*

---

## 3. Held-Out Test Set Performance (20% Split, $N=2,000$)

| Candidate Model | Test Accuracy | Test Precision | Test Recall | Test F1 | Test ROC-AUC | Brier Score Loss | Selection Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | $0.9080$ | $0.9254$ | $0.9269$ | $0.9262$ | $0.9019$ | $0.0763$ | Candidate |
| **Decision Tree** | $0.9495$ | $0.9583$ | $0.9606$ | $0.9595$ | $0.9571$ | $0.0471$ | Candidate |
| **Random Forest** | $\mathbf{0.9510}$ | $0.9584$ | $\mathbf{0.9631}$ | $\mathbf{0.9607}$ | $0.9602$ | $0.0498$ | **DEPLOYED CHAMPION** |
| **Gradient Boosting** | $0.9500$ | $\mathbf{0.9613}$ | $0.9582$ | $0.9598$ | $\mathbf{0.9629}$ | $0.0460$ | Candidate |

### Confusion Matrix on Test Set ($N=2,000$)

#### Random Forest (Deployed Champion):
```text
               Predicted Negative (0)    Predicted Positive (1)
Actual (0)             703                         52
Actual (1)              46                       1199
```

#### Gradient Boosting (Candidate):
```text
               Predicted Negative (0)    Predicted Positive (1)
Actual (0)             707                         48
Actual (1)              52                       1193
```

---

## 4. Integrity & Ablation Experiments

To evaluate feature dependencies and assess reliance on credit score vs. financial ratios, ablation scenarios were evaluated:

| Experiment Scenario | Features Used | Test Accuracy | Test Precision | Test Recall | Test F1 | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Full Feature Model** | 20 features | **0.9500** | **0.9613** | **0.9582** | **0.9598** | **0.9629** |
| **2. Without CIBIL Score** | 19 features | **0.6405** | **0.6368** | **0.9831** | **0.7730** | **0.6495** |
| **3. Raw Features Only** | 11 features | **0.9410** | **0.9483** | **0.9574** | **0.9528** | **0.9597** |
| **4. Engineered Features Only** | 9 features (no CIBIL) | **0.6320** | **0.6317** | **0.9807** | **0.7684** | **0.6269** |

---

## 5. Train/Test Split Sensitivity Analysis

Evaluated stability across 5 distinct random seed partitions:

| Random Seed | Test Accuracy | Test Precision | Test Recall | Test F1 | Test ROC-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **42** | $0.9500$ | $0.9613$ | $0.9582$ | $0.9598$ | $0.9629$ |
| **7** | $0.9430$ | $0.9528$ | $0.9548$ | $0.9538$ | $0.9608$ |
| **21** | $0.9555$ | $0.9608$ | $0.9683$ | $0.9645$ | $0.9688$ |
| **100** | $0.9540$ | $0.9644$ | $0.9614$ | $0.9629$ | $0.9681$ |
| **2026** | $0.9555$ | $0.9639$ | $0.9652$ | $0.9646$ | $0.9696$ |

- **Mean F1 Score:** $\mathbf{0.9611 \pm 0.0040}$
- **Mean ROC-AUC:** $\mathbf{0.9660 \pm 0.0037}$
- **Mean Accuracy:** $\mathbf{0.9513}$

---

## 6. Selection Rationale

**Champion Model:** `Random Forest Classifier` (`loan-model-v2.1-synthetic-10000`)

1. **Top Cross-Validation F1:** Achieved the highest 5-fold cross-validation F1 score ($0.9624 \pm 0.0030$), which is the authoritative primary model-selection criterion.
2. **Robust Recall & Generalization:** Highest cross-validation recall ($0.9727$) and test F1 score ($0.9607$), providing resilient ensemble predictions across diverse financial profiles.
3. **Transparent Governance:** Candidate models (including Gradient Boosting, Decision Tree, and Logistic Regression) remain fully visible in comparative telemetry and benchmarking reports.
