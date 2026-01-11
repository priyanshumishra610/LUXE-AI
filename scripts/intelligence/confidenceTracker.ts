export interface ConfidenceSnapshot {
  classification: number;
  planning: number;
  generation: number;
  critique: number;
  overall: number;
}

export class ConfidenceTracker {
  private snapshots: ConfidenceSnapshot[] = [];
  private current: ConfidenceSnapshot = {
    classification: 0,
    planning: 0,
    generation: 0,
    critique: 0,
    overall: 0,
  };

  updateClassification(confidence: number): void {
    this.current.classification = confidence;
    this.updateOverall();
  }

  updatePlanning(confidence: number): void {
    this.current.planning = confidence;
    this.updateOverall();
  }

  updateGeneration(confidence: number): void {
    this.current.generation = confidence;
    this.updateOverall();
  }

  updateCritique(confidence: number): void {
    this.current.critique = confidence;
    this.updateOverall();
  }

  private updateOverall(): void {
    const weights = {
      classification: 0.2,
      planning: 0.3,
      generation: 0.3,
      critique: 0.2,
    };

    this.current.overall = Math.round((
      this.current.classification * weights.classification +
      this.current.planning * weights.planning +
      this.current.generation * weights.generation +
      this.current.critique * weights.critique
    ) * 100) / 100;
  }

  getCurrent(): ConfidenceSnapshot {
    return { ...this.current };
  }

  snapshot(): void {
    this.snapshots.push({ ...this.current });
  }

  isLow(): boolean {
    return this.current.overall < 0.5;
  }

  isCritical(): boolean {
    return this.current.overall < 0.3;
  }
}
