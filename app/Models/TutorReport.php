<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TutorReport extends Model
{
  protected $fillable = [
    'tutor_id','window_id','status','submitted_at','file_path','hours_total',
    'notes','reviewed_by','reviewed_at','review_notes'
  ];
  protected $casts = ['submitted_at'=>'datetime','reviewed_at'=>'datetime'];

  public function tutor()  { return $this->belongsTo(Tutor::class); }
  public function window() { return $this->belongsTo(ReportWindow::class, 'window_id'); }
  public function files(){ return $this->hasMany(TutorReportFile::class,'tutor_report_id'); }
}

