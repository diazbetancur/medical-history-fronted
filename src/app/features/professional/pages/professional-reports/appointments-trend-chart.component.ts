import { Component, Input, computed, signal } from '@angular/core';
import { BarChartModule, Color, ScaleType } from '@swimlane/ngx-charts';
import type { AppointmentTrendPointDto } from '@data/api/api-models';

@Component({
  selector: 'app-appointments-trend-chart',
  standalone: true,
  imports: [BarChartModule],
  template: `
    <ngx-charts-bar-vertical-2d
      [results]="series()"
      [scheme]="scheme"
      [gradient]="false"
      [xAxis]="true"
      [yAxis]="true"
      [legend]="true"
      [showXAxisLabel]="true"
      xAxisLabel="Mes"
      [showYAxisLabel]="true"
      yAxisLabel="Cantidad de citas"
      [roundDomains]="true"
      [barPadding]="2"
      [groupPadding]="8"
    />
  `,
  styles: [':host { display: block; width: 100%; height: 320px; }'],
})
export class AppointmentsTrendChartComponent {
  private readonly _points = signal<AppointmentTrendPointDto[]>([]);

  @Input() set points(value: AppointmentTrendPointDto[]) {
    this._points.set(value ?? []);
  }

  readonly scheme: Color = {
    name: 'appointments',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981', '#2563eb', '#dc2626', '#d97706'], // atendidos, confirmados, cancelados, no-show
  };

  readonly series = computed(() =>
    this._points().map((p) => ({
      name: p.label,
      series: [
        { name: 'Atendidos', value: p.attendedCount },
        { name: 'Confirmados', value: p.confirmedCount },
        { name: 'Cancelados', value: p.cancelledCount },
        { name: 'No presentados', value: p.noShowCount },
      ],
    })),
  );
}
