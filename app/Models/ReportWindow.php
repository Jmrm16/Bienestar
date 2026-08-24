<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportWindow extends Model
{
  protected $fillable = [
    'period_id','name','tutor_type',
    'open_at','due_at','close_at',
    'instructions','is_published',
    'category','required_items'
  ];

  protected $casts = [
    'open_at'=>'datetime',
    'due_at'=>'datetime',
    'close_at'=>'datetime',
    'is_published'=>'boolean',
    'required_items'=>'array',
  ];

  public function period() {
    return $this->belongsTo(ReportPeriod::class, 'period_id');
  }

  public function tutorReports() {
    return $this->hasMany(TutorReport::class, 'window_id');
  }
}
