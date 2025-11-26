<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportPeriod extends Model
{
  protected $fillable = ['code','name','starts_at','ends_at','is_active'];
  protected $casts = ['starts_at'=>'date','ends_at'=>'date','is_active'=>'boolean'];

  public function windows() { return $this->hasMany(ReportWindow::class, 'period_id'); }
}
