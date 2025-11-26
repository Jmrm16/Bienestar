<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TutorReportFile extends Model {
  protected $fillable = ['tutor_report_id','label','path','size','mime'];
  public function report(){ return $this->belongsTo(TutorReport::class,'tutor_report_id'); }
}